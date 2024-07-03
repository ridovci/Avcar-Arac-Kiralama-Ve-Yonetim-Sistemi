using Microsoft.AspNetCore.Mvc;
using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using AvciCarRental.Api.Services;
using FluentValidation;
using FluentValidation.Results;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/vehicles' altında yer alacak.
    [Route("api/vehicles")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class VehiclesController : ControllerBase
    {
        // Veritabanı bağlamını (_context), loglama servisini (_loggingService) ve validatörü (_vehicleValidator) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private readonly IValidator<Vehicle> _vehicleValidator;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı, loglama servisi ve validatör enjekte edilir.
        public VehiclesController(AvciCarRentalDbContext context, LoggingService loggingService, IValidator<Vehicle> vehicleValidator)
        {
            _context = context; // Enjekte edilen veritabanı bağlamını _context değişkenine ata.
            _loggingService = loggingService; // Enjekte edilen loglama servisini _loggingService değişkenine ata.
            _vehicleValidator = vehicleValidator; // Enjekte edilen validatörü _vehicleValidator değişkenine ata.
        }

        // Sayfalanmış sonuçları tutan bir sınıf. Bu sınıf, belirli bir türdeki (T) nesnelerin listesini ve toplam sayısını içerir.
        public class PagedResult<T>
        {
            public List<T> Items { get; set; } // Sayfalanmış sonuçların listesi
            public int TotalCount { get; set; } // Toplam sonuç sayısı
        }

        // JWT'den kullanıcı kimliğini alır ve _userId'ye atar.
        private void SetUserIdFromJwt()
        {
            // HttpContext.User.Claims koleksiyonunu dolaşarak 'id' tipindeki claim'i bulur. Bulamazsa null döner.
            var userIdClaim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            // userIdClaim null değilse ve integer'a çevrilebiliyorsa _userId'e atar, değilse _userId null olur.
            _userId = !string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId) ? userId : (int?)null;
        }

        // Tüm araçları sayfalanmış şekilde listeler. Asenkron bir metod olduğu için Task<ActionResult<PagedResult<VehicleDto>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<PagedResult<VehicleDto>>> GetVehicles(int page = 1, int pageSize = 5, string sortField = "createdDate", string sortOrder = "asc", int? status = null, string searchQuery = "")
        {
            // Veritabanında araçları sorgulamak için bir IQueryable oluşturur ve ilgili tüm varlıkları dahil eder.
            var query = _context.Vehicles
                .Include(v => v.Model)
                    .ThenInclude(m => m.Brand)
                .Include(v => v.Location)
                .Include(v => v.VehicleType)
                .Include(v => v.Color)
                .Include(v => v.GearType)
                .Include(v => v.FuelType)
                .Include(v => v.AirConditioning)
                .Include(v => v.VehicleImages)
                .Include(v => v.VehicleFeatureAssignments)
                    .ThenInclude(vfa => vfa.VehicleFeatures)
                .AsQueryable();

            // Eğer searchQuery boş değilse, araç plakası bu sorguyu içeren araçları filtreler.
            if (!string.IsNullOrEmpty(searchQuery))
            {
                query = query.Where(v => v.NumberPlate.Contains(searchQuery));
            }

            // Eğer status değeri sağlanmışsa, bu duruma sahip araçları filtreler.
            if (status.HasValue)
            {
                query = query.Where(v => v.Status == status.Value);
            }

            // Sıralama alanına ve sıralama düzenine göre araçları sıralar.
            switch (sortField.ToLower())
            {
                case "brandname":
                    query = sortOrder == "asc" ? query.OrderBy(v => v.Model.Brand.BrandName) : query.OrderByDescending(v => v.Model.Brand.BrandName);
                    break;
                case "modelname":
                    query = sortOrder == "asc" ? query.OrderBy(v => v.Model.ModelName) : query.OrderByDescending(v => v.Model.ModelName);
                    break;
                case "modelyear":
                    query = sortOrder == "asc" ? query.OrderBy(v => v.ModelYear) : query.OrderByDescending(v => v.ModelYear);
                    break;
                case "createddate":
                    query = sortOrder == "asc" ? query.OrderBy(v => v.VehicleId) : query.OrderByDescending(v => v.VehicleId);
                    break;
                default:
                    query = sortOrder == "asc" ? query.OrderBy(v => v.VehicleId) : query.OrderByDescending(v => v.VehicleId);
                    break;
            }

            // Toplam öğe sayısını alır.
            var totalItems = await query.CountAsync();

            // Sorguyu sayfalayarak sonuçları alır ve DTO'ya (Data Transfer Object) dönüştürür.
            var vehicles = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(v => new VehicleDto
                {
                    VehicleId = v.VehicleId,
                    ModelId = v.ModelId,
                    BrandName = v.Model.Brand.BrandName,
                    ModelName = v.Model.ModelName,
                    ModelYear = v.ModelYear,
                    VehicleTypeId = v.VehicleTypeId,
                    VehicleTypeName = v.VehicleType.VehicleTypeName,
                    FuelTypeId = v.FuelTypeId,
                    FuelTypeName = v.FuelType.FuelTypeName,
                    GearTypeId = v.GearTypeId,
                    GearTypeName = v.GearType.GearTypeName,
                    AirConditioningId = v.AirConditioningId,
                    HasAirConditioning = v.AirConditioning != null,
                    NumberOfPeople = v.NumberOfPeople,
                    NumberOfDoors = v.NumberOfDoors,
                    ColorId = v.ColorId,
                    ColorName = v.Color.ColorName,
                    NumberPlate = v.NumberPlate,
                    LocationId = v.LocationId,
                    LocationName = v.Location.LocationName,
                    DailyRentalFee = v.DailyRentalFee,
                    DiscountRate = v.DiscountRate ?? 0,
                    MinDriverAge = v.MinDriverAge,
                    MinDrivingLicenseYear = v.MinDrivingLicenseYear,
                    Status = v.Status,
                    Description = v.Description,
                    VehicleImages = v.VehicleImages.Select(vi => new VehicleImageDto
                    {
                        VehicleImageId = vi.VehicleImageId,
                        VehicleImageUrl = vi.VehicleImageUrl,
                    }).ToList(),
                    VehicleFeatures = v.VehicleFeatureAssignments.Select(vfa => vfa.VehicleFeatures.VehicleFeatureName).ToList()
                })
                .ToListAsync();

            // Sonuçları PagedResult nesnesine sarar ve döner.
            var result = new PagedResult<VehicleDto>
            {
                Items = vehicles,
                TotalCount = totalItems
            };

            return Ok(result);
        }

        // Toplam araç sayısını döner.
        [HttpGet("counter")]
        public async Task<ActionResult<int>> GetVehiclesCount()
        {
            int pendingCount = await _context.Vehicles.CountAsync();
            return Ok(pendingCount);
        }

        // Belirli bir ID'ye sahip aracı getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetVehicle(int id)
        {
            // Veritabanında belirtilen ID'ye sahip aracı tüm ilişkili varlıklarla birlikte asenkron olarak bulur. Bulamazsa null döner.
            var vehicle = await _context.Vehicles
                .Include(v => v.Model)
                    .ThenInclude(m => m.Brand)
                .Include(v => v.Location)
                .Include(v => v.VehicleType)
                .Include(v => v.Color)
                .Include(v => v.GearType)
                .Include(v => v.FuelType)
                .Include(v => v.AirConditioning)
                .Include(v => v.VehicleImages)
                .Include(v => v.VehicleFeatureAssignments)
                    .ThenInclude(vfa => vfa.VehicleFeatures)
                .FirstOrDefaultAsync(v => v.VehicleId == id);

            // vehicle null ise NotFound (HTTP 404) döner, değilse aracı döner.
            if (vehicle == null)
            {
                return NotFound();
            }

            return vehicle; // Araç bulunduysa aracı döner
        }

        // Yeni bir araç ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<VehicleDto>> PostVehicle(VehicleDto vehicleDto)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                // VehicleDto'yu Vehicle nesnesine dönüştürür.
                var vehicle = new Vehicle
                {
                    ModelId = vehicleDto.ModelId,
                    BrandId = vehicleDto.BrandId,
                    ModelYear = vehicleDto.ModelYear,
                    VehicleTypeId = vehicleDto.VehicleTypeId,
                    FuelTypeId = vehicleDto.FuelTypeId,
                    GearTypeId = vehicleDto.GearTypeId,
                    AirConditioningId = vehicleDto.AirConditioningId,
                    NumberOfPeople = vehicleDto.NumberOfPeople,
                    NumberOfDoors = vehicleDto.NumberOfDoors,
                    ColorId = vehicleDto.ColorId,
                    NumberPlate = vehicleDto.NumberPlate,
                    LocationId = vehicleDto.LocationId,
                    DailyRentalFee = vehicleDto.DailyRentalFee,
                    DiscountRate = vehicleDto.DiscountRate,
                    MinDriverAge = vehicleDto.MinDriverAge,
                    MinDrivingLicenseYear = vehicleDto.MinDrivingLicenseYear,
                    Status = vehicleDto.Status,
                    Description = vehicleDto.Description,
                    VehicleImages = vehicleDto.VehicleImages.Select(img => new VehicleImage
                    {
                        VehicleImageUrl = img.VehicleImageUrl
                    }).ToList(),
                    VehicleFeatureAssignments = vehicleDto.VehicleFeatureAssignments.Select(fa => new VehicleFeatureAssignment
                    {
                        VehicleFeaturesId = fa.VehicleFeaturesId
                    }).ToList()
                };

                // Aracı doğrular.
                ValidationResult result = await _vehicleValidator.ValidateAsync(vehicle);
                if (!result.IsValid)
                {
                    return BadRequest(result.Errors);
                }

                _context.Vehicles.Add(vehicle); // Yeni aracı veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                await LogActionAsync($"{vehicle.VehicleId} Id'li yeni araç eklendi."); // Loglama servisini kullanarak ekleme işlemini loglar.
                return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.VehicleId }, vehicleDto); // Başarılı ekleme işleminden sonra araç detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip aracı günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehicle(int id, [FromBody] Vehicle vehicle)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != vehicle.VehicleId)
            {
                return BadRequest("Id değeri araç nesnesiyle uyumsuz."); // Eğer gönderilen ID ile araç nesnesinin ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // Belirtilen ID'ye sahip mevcut aracı tüm ilişkili varlıklarla birlikte bulur.
            var existingVehicle = _context.Vehicles
                .Include(v => v.VehicleImages)
                .Include(v => v.VehicleFeatureAssignments)
                .FirstOrDefault(v => v.VehicleId == id);

            if (existingVehicle == null)
            {
                return NotFound("Araç bulunamadı."); // Araç bulunamazsa NotFound (HTTP 404) döner.
            }

            // Aracı doğrular.
            ValidationResult result = await _vehicleValidator.ValidateAsync(vehicle);
            if (!result.IsValid)
            {
                return BadRequest(result.Errors); // Doğrulama hataları varsa BadRequest (HTTP 400) döner.
            }

            // Mevcut aracın güncel değerlerini yeni araç nesnesiyle değiştirir.
            _context.Entry(existingVehicle).CurrentValues.SetValues(vehicle);

            // Mevcut aracın resimlerini ve özellik atamalarını temizler ve yeni değerlerle günceller.
            existingVehicle.VehicleImages.Clear();
            foreach (var image in vehicle.VehicleImages)
            {
                existingVehicle.VehicleImages.Add(new VehicleImage { VehicleImageUrl = image.VehicleImageUrl });
            }

            existingVehicle.VehicleFeatureAssignments.Clear();
            foreach (var feature in vehicle.VehicleFeatureAssignments)
            {
                existingVehicle.VehicleFeatureAssignments.Add(new VehicleFeatureAssignment { VehicleFeaturesId = feature.VehicleFeaturesId });
            }

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                await LogActionAsync($"{vehicle.VehicleId} Id'li araç güncellendi."); // Güncelleme işlemini loglar.
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!VehicleExists(id))
                {
                    return NotFound("Araç veritabanında bulunamadı."); // Araç veritabanında bulunamazsa NotFound (HTTP 404) döner.
                }
                else
                {
                    await LogActionAsync($"Araç güncellenirken bir hata oluştu: {ex.Message}"); // Güncelleme işlemi sırasında hata oluşursa loglar ve hatayı yükseltir.
                    throw;
                }
            }
            catch (Exception ex)
            {
                await LogActionAsync($"Araç güncellenirken bir hata oluştu: {ex.Message}"); // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                return StatusCode(500, "Araç güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip aracı siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen aracı veritabanından bulur. Bulamazsa null döner.
                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    await LogActionAsync($"Araç silinirken bulunamadı: ID {id}"); // Araç bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    return NotFound("Araç bulunamadı.");
                }

                // Aracı veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.Vehicles.Remove(vehicle);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                await LogActionAsync($"{vehicle.VehicleId} Id'li araç silindi."); // Silme işlemini loglar.
                return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                await LogActionAsync($"Araç silinirken bir hata oluştu: {ex.Message}"); // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                return StatusCode(500, "Araç silinirken bir hata oluştu.");
            }
        }

        // Araç arama işlemini gerçekleştirir. Belirli arama kriterlerine göre araçları sayfalar.
        [HttpPost("search")]
        public async Task<IActionResult> SearchVehicles([FromBody] VehicleSearchCriteria criteria, int page = 1, int pageSize = 10)
        {
            if (criteria == null)
            {
                return BadRequest("Arama kriterleri sağlanmalıdır."); // Arama kriterleri sağlanmadıysa BadRequest (HTTP 400) döner.
            }

            if (criteria.RentalDate < DateTime.Today)
            {
                return BadRequest("Alış tarihi bugünden önce olamaz."); // Alış tarihi bugünden önce olamazsa BadRequest (HTTP 400) döner.
            }

            if (criteria.RentalDate > criteria.ReturnDate)
            {
                return BadRequest("İade tarihi, alış tarihinden önce olamaz."); // İade tarihi alış tarihinden önce olamazsa BadRequest (HTTP 400) döner.
            }

            // Sıralama düzenini belirler.
            string[] orderParts = criteria.SortOrder?.Split(new char[] { 'A', 'D' }, 2);
            string sortBy = orderParts?[0];
            string sortDirection = orderParts?.Length > 1 && orderParts[1].StartsWith("sc") ? "asc" : "desc";

            // Veritabanında araçları sorgulamak için bir IQueryable oluşturur ve ilgili tüm varlıkları dahil eder.
            IQueryable<Vehicle> query = _context.Vehicles
                .Include(v => v.Model)
                .ThenInclude(m => m.Brand)
                .Include(v => v.VehicleType)
                .Include(v => v.FuelType)
                .Include(v => v.Color)
                .Include(v => v.GearType)
                .Include(v => v.AirConditioning)
                //.Include(v => v.VehicleFeatureAssignments) //Çok uzun döngüye girdiği için kaldırıldı.
                //.ThenInclude(vfa => vfa.VehicleFeatures)
                .Include(v => v.VehicleImages)
                .AsQueryable();

            // Konum ID'sine ve durumuna göre araçları filtreler.
            query = query.Where(v => v.LocationId == criteria.LocationId && v.Status == 3);

            // Kiralama sırasında kullanılamayan araç ID'lerini belirler.
            var unavailableVehicleIds = await _context.Rentals
                .Where(r =>
                    (r.DepartureLocationId == criteria.LocationId || r.ArrivalLocationId == criteria.LocationId) &&
                    r.RentalDate.Date < criteria.ReturnDate.Value.Date &&
                    r.ReturnDate.Date > criteria.RentalDate.Value.Date &&
                    (r.Status == RentalStatus.Approved || r.Status == RentalStatus.Pending))
                .Select(r => r.VehicleId)
                .ToListAsync();

            // Kullanılamayan araç ID'leri hariç tutar.
            query = query.Where(v => !unavailableVehicleIds.Contains(v.VehicleId));

            // Model ID'sine göre filtreleme yapar.
            if (criteria.ModelId.HasValue)
            {
                query = query.Where(v => v.ModelId == criteria.ModelId.Value);
            }

            // Marka ID'sine göre filtreleme yapar.
            if (criteria.BrandId.HasValue)
            {
                query = query.Where(v => v.Model.BrandId == criteria.BrandId.Value);
            }

            // Araç tipi ID'sine göre filtreleme yapar.
            if (criteria.VehicleTypeId.HasValue)
            {
                query = query.Where(v => v.VehicleTypeId == criteria.VehicleTypeId.Value);
            }

            // Vites tipi ID'sine göre filtreleme yapar.
            if (criteria.GearTypeId.HasValue)
            {
                query = query.Where(v => v.GearTypeId == criteria.GearTypeId.Value);
            }

            // Yakıt tipi ID'sine göre filtreleme yapar.
            if (criteria.FuelTypeId.HasValue)
            {
                query = query.Where(v => v.FuelTypeId == criteria.FuelTypeId.Value);
            }

            // Klima tipi ID'sine göre filtreleme yapar.
            if (criteria.AirConditioningId.HasValue)
            {
                query = query.Where(v => v.AirConditioningId == criteria.AirConditioningId.Value);
            }

            // Minimum günlük kira ücretine göre filtreleme yapar.
            if (criteria.MinDailyRentalFee.HasValue)
            {
                query = query.Where(v => v.DailyRentalFee >= criteria.MinDailyRentalFee.Value);
            }

            // Maksimum günlük kira ücretine göre filtreleme yapar.
            if (criteria.MaxDailyRentalFee.HasValue)
            {
                query = query.Where(v => v.DailyRentalFee <= criteria.MaxDailyRentalFee.Value);
            }

            // Özellik ID'lerine göre filtreleme yapar.
            if (criteria.FeatureIds != null && criteria.FeatureIds.Count > 0)
            {
                foreach (var featureId in criteria.FeatureIds)
                {
                    query = query.Where(v => v.VehicleFeatureAssignments.Any(fa => fa.VehicleFeaturesId == featureId));
                }
            }

            // Minimum model yılına göre filtreleme yapar.
            if (criteria.MinModelYear.HasValue)
            {
                query = query.Where(v => v.ModelYear >= criteria.MinModelYear.Value);
            }

            // Maksimum model yılına göre filtreleme yapar.
            if (criteria.MaxModelYear.HasValue)
            {
                query = query.Where(v => v.ModelYear <= criteria.MaxModelYear.Value);
            }

            // Fiyata göre sıralama yapar.
            if (sortBy == "price")
            {
                query = query.OrderByDynamic("DailyRentalFee", sortDirection);
            }

            // Toplam sonuç sayısını alır.
            var totalCount = await query.CountAsync();

            // Sayfalama ve sonuçları alır.
            var vehicles = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Sonuçları döner.
            var pagedResult = new PagedResult<Vehicle>
            {
                Items = vehicles,
                TotalCount = totalCount
            };

            return Ok(pagedResult);
        }

        // Bakım modunda olan araçları listeler.
        [HttpGet("maintenance")]
        public async Task<ActionResult<List<VehicleDto>>> MaintenanceVehicleList()
        {
            // Bakım modunda olan araçları liste olarak alır.
            var vehicleList = await _context.Vehicles
                .Include(r => r.VehicleImages)
                .Include(r => r.Model)
                .Include(r => r.Brand)
                .Where(r => r.Status == 0 || r.Status == 1)
                .ToListAsync();

            return Ok(vehicleList); // Bakım modunda olan araçları döner.
        }

        // Plaka numarasına göre aracın ID'sini döner.
        [HttpGet("by-plate/{plate}")]
        public async Task<ActionResult<int>> GetVehicleIdByPlate(string plate)
        {
            // Belirli plaka numarasına sahip aracı bulur.
            var vehicle = await _context.Vehicles
                                .Where(v => v.NumberPlate == plate)
                                .SingleOrDefaultAsync();

            if (vehicle == null)
            {
                return BadRequest("Araç Bulunamadı!"); // Eğer araç bulunamazsa BadRequest (HTTP 400) döner.
            }

            return Ok(vehicle); // Araç bulunursa ID'sini döner.
        }

        // Verilen ID'ye sahip aracın var olup olmadığını kontrol eder.
        private bool VehicleExists(int id)
        {
            return _context.Vehicles.Any(e => e.VehicleId == id); // Belirtilen ID'ye sahip aracın veritabanında olup olmadığını kontrol eder.
        }

        [HttpGet("check-rental-status")]
        public async Task<ActionResult<bool>> CheckVehicleRentalStatus([FromQuery] int vehicleId)
        {
            // Bugünün tarihini alır.
            var today = DateTime.UtcNow.Date;

            // Veritabanında belirtilen araç ID'sine sahip ve bugünkü tarih aralığında bir kiralama olup olmadığını kontrol eder.
            var isRented = await _context.Rentals
                .AnyAsync(r => r.VehicleId == vehicleId && r.RentalDate <= today && r.ReturnDate >= today && r.Status ==  RentalStatus.Approved);

            // Sonucu döndürür: true eğer araç şu anda kiradaysa, false eğer kirada değilse.
            return Ok(isRented);
        }


        // Belirtilen aksiyonu loglar.
        private async Task LogActionAsync(string action)
        {
            await _loggingService.LogActionAsync(_userId, action, HttpContext); // Verilen aksiyonu loglar.
        }
    }
}
