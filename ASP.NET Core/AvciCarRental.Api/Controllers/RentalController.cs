using Microsoft.AspNetCore.Mvc;
using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using AvciCarRental.Api.Services;
using static AvciCarRental.Api.Controllers.VehiclesController;
using AvciCarRental.Api.DTOs;
using AvciCarRental.Api.Validators;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar.
namespace AvciCarRental.Api.Controllers
{
    // 'api/rentals' adresine gelen tüm istekler bu kontrolör tarafından karşılanır.
    [Route("api/rentals")]
    [ApiController]  // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    public class RentalController : ControllerBase
    {
        // Veritabanı bağlamı, validatör ve loglama servisi tanımlamaları. Bu bağımlılıklar dependency injection ile sağlanır.
        private readonly AvciCarRentalDbContext _context;
        private readonly IValidator<Rental> _validator;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // RentalRequestModel: Kiralama işlemleri için kullanılan bir model. Rental nesnesi ve ek ürün ID'leri içerir.
        public class RentalRequestModel
        {
            public Rental Rental { get; set; }
            public int[] AdditionalProductIds { get; set; }
        }

        // Constructor: Dependency injection ile veritabanı bağlamı, validatör ve loglama servisi enjekte edilir.
        public RentalController(AvciCarRentalDbContext context, IValidator<Rental> validator, LoggingService loggingService)
        {
            _context = context;
            _validator = validator;
            _loggingService = loggingService;
        }

        // Kullanıcı ID'sini JWT'den alır ve _userId'e atar. Bu işlem her istekle yapılan bir önyükleme işlemidir.
        private void SetUserIdFromJwt()
        {
            var userIdClaim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            _userId = !string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId) ? userId : (int?)null;
        }

        // GET metodları, belirli sorgu parametrelerine göre kiralama listelerini döner. İsteğe bağlı filtreleme yapılabilir.
        [HttpGet]
        public async Task<ActionResult<PagedResult<RentalDto>>> GetRentals(
            [FromQuery] int? rentalUserId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 5,
            [FromQuery] RentalStatus? status = null,
            [FromQuery] string searchQuery = "")
        {
            var query = _context.Rentals
                .Include(r => r.Vehicle)
                    .ThenInclude(v => v.Model)
                        .ThenInclude(m => m.Brand)
                .Include(r => r.User)
                    .ThenInclude(u => u.UserPersonalInfo)
                .Include(r => r.User)
                    .ThenInclude(u => u.UserContactInfo)
                .Include(r => r.DepartureLocation)
                .Include(r => r.ArrivalLocation)
                .Include(r => r.AdditionalRentalProductAssignments)
                    .ThenInclude(arpa => arpa.AdditionalRentalProduct)
                .AsQueryable();

            // Arama sorgusuna göre filtreleme
            if (!string.IsNullOrEmpty(searchQuery))
            {
                query = query.Where(r =>
                    r.Vehicle.Model.ModelName.Contains(searchQuery) ||
                    r.Vehicle.Model.Brand.BrandName.Contains(searchQuery) ||
                    r.Vehicle.NumberPlate.Contains(searchQuery)
                );
            }

            // Durum filtresi
            if (status.HasValue)
            {
                query = query.Where(r => r.Status == status.Value);
            }

            // Kullanıcı ID'sine göre filtreleme
            if (rentalUserId.HasValue && rentalUserId.Value > 0)
            {
                query = query.Where(r => r.UserId == rentalUserId.Value);
            }

            // Toplam kayıt sayısını hesaplama
            var totalItems = await query.CountAsync();

            // Sayfalama uygulayarak sonuç listesi hazırlama
            var rentalsList = await query
                .OrderByDescending(r => r.RentalId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Dto'ya çevirme işlemi
            var rentals = rentalsList.Select(r =>
            {
                var totalPrice = (r.ReturnDate - r.RentalDate).Days * r.Vehicle.DailyRentalFee;
                totalPrice += r.AdditionalRentalProductAssignments?
                                  .Sum(ap => ap.AdditionalRentalProduct.AdditionalRentalProductFee) ?? 0;

                return new RentalDto
                {
                    RentalId = r.RentalId,
                    StartDate = r.RentalDate,
                    EndDate = r.ReturnDate,
                    VehiclePlate = r.Vehicle.NumberPlate,
                    VehicleModel = r.Vehicle.Model?.ModelName ?? "Model bilgisi yok",
                    BrandName = r.Vehicle.Model?.Brand?.BrandName ?? "Marka bilgisi yok",
                    ModelYear = r.Vehicle.ModelYear,
                    CustomerName = r.User.UserPersonalInfo != null ? r.User.UserPersonalInfo.FirstName + " " + r.User.UserPersonalInfo.LastName : "Bilinmiyor",
                    DepartureLocationName = r.DepartureLocation?.LocationName ?? "Başlangıç lokasyonu yok",
                    ArrivalLocationName = r.ArrivalLocation?.LocationName ?? "Varış lokasyonu yok",
                    Status = Enum.GetName(typeof(RentalStatus), r.Status),
                    TotalPrice = totalPrice,
                    RequestDate = r.RequestDate,
                    MobilePhone = r.User.UserContactInfo?.MobilePhone ?? "Telefon bilgisi yok"
                };
            }).ToList();

            // Sayfalı sonuç olarak kullanıcılara döner.
            return Ok(new PagedResult<RentalDto>
            {
                Items = rentals,
                TotalCount = totalItems
            });
        }

        // Belirli bir kiralama ID'ye göre detayları getiren GET metodu.
        [HttpGet("{id}")]
        public async Task<ActionResult<Rental>> GetRentalById(int id)
        {
            var rental = await _context.Rentals
                .Include(r => r.Vehicle)
                .Include(r => r.User)
                .Include(r => r.DepartureLocation)
                .Include(r => r.ArrivalLocation)
                .Include(r => r.AdditionalRentalProductAssignments)
                .ThenInclude(ap => ap.AdditionalRentalProduct)
                .FirstOrDefaultAsync(r => r.RentalId == id);

            // Kiralama bulunamazsa hata mesajı döner
            if (rental == null)
            {
                return BadRequest("Kiralama bulunamadı.");
            }

            return Ok(rental);
        }

        // Yeni bir kiralama oluşturmak için kullanılan POST metodu.
        [HttpPost]
        public async Task<IActionResult> CreateRental([FromBody] RentalRequestModel model)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'e atar.
            try
            {
                // Gelen modelin geçerliliğini kontrol eder.
                if (model == null)
                {
                    return BadRequest("Kiralama talep modeli boş olamaz.");
                }

                if (model.Rental == null)
                {
                    return BadRequest("Kiralama bilgileri boş olamaz.");
                }

                // Modelin geçerliliğini doğrulayan validasyon işlemi.
                ValidationResult result = await _validator.ValidateAsync(model.Rental);
                if (!result.IsValid)
                {
                    return BadRequest(result.Errors);
                }

                // Seçilen aracın belirtilen tarihler arasında müsait olup olmadığını kontrol eder.
                if (!await VehicleAvailable(model.Rental.VehicleId, model.Rental.RentalDate, model.Rental.ReturnDate))
                {
                    return BadRequest("Araç belirtilen tarihler için müsait değildir.");
                }

                // Kiralama yapacak kullanıcının bilgilerini kontrol eder.
                var user = await _context.Users
                    .Include(u => u.UserPersonalInfo)
                    .Include(u => u.UserLicenseInfo)
                    .FirstOrDefaultAsync(u => u.UserId == model.Rental.UserId);

                if (user == null || user.UserPersonalInfo == null || user.UserLicenseInfo == null)
                {
                    return BadRequest("Geçersiz kullanıcı bilgileri.");
                }

                // Kiralama başlangıç ve bitiş lokasyonlarının geçerliliğini kontrol eder.
                var departureLocationExists = await _context.Locations.AnyAsync(l => l.LocationId == model.Rental.DepartureLocationId);
                var arrivalLocationExists = await _context.Locations.AnyAsync(l => l.LocationId == model.Rental.ArrivalLocationId);

                if (!departureLocationExists || !arrivalLocationExists)
                {
                    return BadRequest("Geçersiz ofis lokasyon bilgileri.");
                }

                // Aracın başlangıç lokasyonunda mevcut olup olmadığını kontrol eder.
                var vehicleAtLocation = await _context.Vehicles
                .AnyAsync(v => v.VehicleId == model.Rental.VehicleId && v.LocationId == model.Rental.DepartureLocationId);

                if (!vehicleAtLocation)
                {
                    return BadRequest("Araç belirtilen alış lokasyonunda mevcut değildir.");
                }

                // Aracın bilgilerini kontrol eder.
                var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == model.Rental.VehicleId);
                if (vehicle == null)
                {
                    return BadRequest("Geçersiz araç bilgileri.");
                }

                // Kullanıcının yaş ve ehliyet gereksinimlerini karşılayıp karşılamadığını kontrol eder.
                if (!MeetsAgeAndLicenseRequirements(user.UserPersonalInfo, user.UserLicenseInfo, vehicle))
                {
                    return BadRequest("Kullanıcı, seçilen araç için yaş veya ehliyet gereksinimlerini karşılamıyor.");
                }

                // Kiralama nesnesini veritabanına ekler.
                model.Rental.RequestDate = DateTime.Now;
                _context.Rentals.Add(model.Rental);
                await _context.SaveChangesAsync();

                // Ek ürünleri kiralama nesnesine atar ve kaydeder.
                if (model.AdditionalProductIds != null && model.AdditionalProductIds.Length > 0)
                {
                    foreach (var productId in model.AdditionalProductIds)
                    {
                        var assignment = new AdditionalRentalProductAssignment
                        {
                            RentalId = model.Rental.RentalId,
                            AdditionalRentalProductId = productId
                        };
                        _context.AdditionalRentalProductAssignments.Add(assignment);
                    }

                    await _context.SaveChangesAsync();
                }

                // Ek ürünlerin eklendiğini loglar.
                await LogActionAsync($"{model.Rental.RentalId} ID'li kiralama ve ek ürünler oluşturuldu.");
                // Başarılı bir şekilde kiralama oluşturulduğunu ve yeni kaydın detaylarını döner.
                return CreatedAtAction(nameof(GetRentalById), new { id = model.Rental.RentalId }, model.Rental);
            }
            catch (Exception ex)
            {
                // Hata durumunda hata mesajını loglar ve 500 durum kodu ile hata mesajını döner.
                await LogActionAsync($"Kiralama oluşturulurken hata: {ex.Message}");
                return StatusCode(500, "Kiralama oluşturulurken hata oluştu.");
            }
        }



        // Admin veya Superadmin rolleri için belirli bir kiralamanın bilgilerini güncellemek için kullanılan PUT metodu.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRental(int id, [FromBody] RentalRequestModel model)
        {
            SetUserIdFromJwt();  // Kullanıcı ID'sini JWT'den alır ve _userId'e atar.
            try
            {
                // Gelen modelin geçerliliğini kontrol eder.
                if (model == null)
                {
                    return BadRequest("Kiralama talep modeli boş olamaz.");
                }

                if (model.Rental == null)
                {
                    return BadRequest("Kiralama bilgileri boş olamaz.");
                }

                // Var olan kiralama nesnesini bulur.
                var existingRental = await _context.Rentals.FindAsync(id);
                if (existingRental == null)
                {
                    return NotFound("Kiralama bulunamadı.");
                }

                // Tamamlanmış bir kiralamanın bilgileri güncellenemez.
                if (existingRental.Status == RentalStatus.Completed)
                {
                    return BadRequest("Tamamlanmış kiralama bilgileri güncellenemez.");
                }





                bool isStatusUpdateOnly = DetermineIfStatusUpdateOnly(model, existingRental);

                // Kiralama modelinin doğrulamasını gerçekleştirir ve eğer geçerli değilse hata mesajı döner.
                ValidationResult result = await new RentalValidator(isStatusUpdateOnly).ValidateAsync(model.Rental);
                if (!result.IsValid)
                {
                    return BadRequest(result.Errors); // Doğrulama geçerli değilse, hataları içeren bir BadRequest cevabı döner.
                }




                // Kiralamanın durumu tamamlanmışsa ve başlangıç ile bitiş lokasyonları farklıysa, aracın lokasyonunu günceller.
                if (model.Rental.Status == RentalStatus.Completed && existingRental.DepartureLocationId != existingRental.ArrivalLocationId)
                {
                    var vehicleToUpdate = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == existingRental.VehicleId);
                    if (vehicleToUpdate != null)
                    {
                        vehicleToUpdate.LocationId = model.Rental.ArrivalLocationId;
                        _context.Vehicles.Update(vehicleToUpdate);
                    }
                }

                // Kullanıcı ID'sinin geçerli olup olmadığını kontrol eder.
                if (!_userId.HasValue)
                {
                    return Unauthorized("Kullanıcı kimliği alınamadı.");
                }

                // Kullanıcının rolünü kontrol eder.
                var userRole = HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
                if (userRole == "Admin" || userRole == "Superadmin")
                {
                    existingRental.AdminActionDate = DateTime.Now;
                    existingRental.AdminUserId = _userId.Value;
                }

                // Seçilen aracın belirtilen tarihler arasında müsait olup olmadığını kontrol eder.
                if (!await VehicleAvailable(model.Rental.VehicleId, model.Rental.RentalDate, model.Rental.ReturnDate, id))
                {
                    return BadRequest("Araç belirtilen tarihler için müsait değildir.");
                }

                // Kiralama yapacak kullanıcının bilgilerini kontrol eder.
                var user = await _context.Users
                    .Include(u => u.UserPersonalInfo)
                    .Include(u => u.UserLicenseInfo)
                    .FirstOrDefaultAsync(u => u.UserId == model.Rental.UserId);

                if (user == null || user.UserPersonalInfo == null || user.UserLicenseInfo == null)
                {
                    return BadRequest("Geçersiz kullanıcı bilgileri.");
                }

                // Kiralama başlangıç ve bitiş lokasyonlarının geçerliliğini kontrol eder.
                var departureLocationExists = await _context.Locations.AnyAsync(l => l.LocationId == model.Rental.DepartureLocationId);
                var arrivalLocationExists = await _context.Locations.AnyAsync(l => l.LocationId == model.Rental.ArrivalLocationId);

                if (!departureLocationExists || !arrivalLocationExists)
                {
                    return BadRequest("Geçersiz ofis lokasyon bilgileri.");
                }

                // Aracın başlangıç lokasyonunda mevcut olup olmadığını kontrol eder.
                var vehicleAtLocation = await _context.Vehicles
                .AnyAsync(v => v.VehicleId == model.Rental.VehicleId && v.LocationId == model.Rental.DepartureLocationId);

                if (!vehicleAtLocation && !isStatusUpdateOnly)
                {
                    return BadRequest("Araç belirtilen alış lokasyonunda mevcut değildir.");
                }

                // Aracın bilgilerini kontrol eder.
                var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == model.Rental.VehicleId);
                if (vehicle == null)
                {
                    return BadRequest("Geçersiz araç bilgileri.");
                }

                // Kullanıcının yaş ve ehliyet gereksinimlerini karşılayıp karşılamadığını kontrol eder.
                if (!MeetsAgeAndLicenseRequirements(user.UserPersonalInfo, user.UserLicenseInfo, vehicle))
                {
                    return BadRequest("Kullanıcı, seçilen araç için yaş veya ehliyet gereksinimlerini karşılamıyor.");
                }

                // Kiralamanın durumunda değişiklik olup olmadığını kontrol eder.
                var statusChanged = existingRental.Status != model.Rental.Status;
                var oldStatus = existingRental.Status;

                // Var olan kiralama nesnesinin bilgilerini günceller.
                existingRental.VehicleId = model.Rental.VehicleId;
                existingRental.DepartureLocationId = model.Rental.DepartureLocationId;
                existingRental.ArrivalLocationId = model.Rental.ArrivalLocationId;
                existingRental.RentalDate = model.Rental.RentalDate;
                existingRental.ReturnDate = model.Rental.ReturnDate;
                existingRental.RequestDate = model.Rental.RequestDate;
                existingRental.Status = model.Rental.Status;

                await _context.SaveChangesAsync();

                // Mevcut ek ürün atamalarını kaldırır.
                var existingAssignments = await _context.AdditionalRentalProductAssignments
                    .Where(a => a.RentalId == id)
                    .ToListAsync();
                _context.AdditionalRentalProductAssignments.RemoveRange(existingAssignments);

                // Yeni ek ürün atamalarını ekler.
                foreach (var productId in model.AdditionalProductIds)
                {
                    var assignment = new AdditionalRentalProductAssignment
                    {
                        RentalId = id,
                        AdditionalRentalProductId = productId
                    };
                    _context.AdditionalRentalProductAssignments.Add(assignment);
                }

                await _context.SaveChangesAsync();

                // Durum değişikliği olduysa, durum değişikliğini de loglar. Aksi takdirde, sadece güncelleme işlemini loglar.
                if (statusChanged)
                {
                    await LogActionAsync($"{id} ID'li kiralama durumu '{oldStatus}''dan '{model.Rental.Status}''a değiştirildi.");
                    await LogActionAsync($"{id} ID'li kiralama güncellendi.");
                }
                else
                {
                    await LogActionAsync($"{id} ID'li kiralama güncellendi.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                // Hata durumunda hata mesajını loglar ve 500 durum kodu ile hata mesajını döner.
                await LogActionAsync($"Kiralama güncellenirken hata: {ex.Message}");
                return StatusCode(500, "Kiralama güncellenirken hata oluştu.");
            }
        }

        // Admin veya Superadmin rolleri için belirli bir kiralamanın onaylanması için kullanılan PUT metodu.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("approve/{id}")]
        public async Task<IActionResult> ApproveRental(int id)
        {
            SetUserIdFromJwt();  // Kullanıcı ID'sini JWT'den alır ve _userId'e atar.
            try
            {
                var rental = await _context.Rentals.FindAsync(id);
                if (rental == null)
                {
                    return NotFound("Kiralama bulunamadı.");
                }

                rental.Status = RentalStatus.Approved;
                rental.AdminActionDate = DateTime.Now;
                rental.AdminUserId = _userId;

                await _context.SaveChangesAsync();

                // Kiralamanın onaylandığını loglar.
                await LogActionAsync($"{id} ID'li kiralama onaylandı.");

                return NoContent();
            }
            catch (Exception ex)
            {
                // Hata durumunda hata mesajını loglar ve 500 durum kodu ile hata mesajını döner.
                await LogActionAsync($"Kiralama onaylanırken hata: {ex.Message}");
                return StatusCode(500, "Kiralama onaylanırken hata oluştu.");
            }
        }

        // Admin veya Superadmin rolleri için belirli bir kiralamanın tamamlanması için kullanılan PUT metodu.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("complete/{id}")]
        public async Task<IActionResult> CompleteRental(int id)
        {
            SetUserIdFromJwt();  // Kullanıcı ID'sini JWT'den alır ve _userId'e atar.
            try
            {
                var rental = await _context.Rentals.FindAsync(id);
                if (rental == null)
                {
                    return NotFound("Kiralama bulunamadı.");
                }

                rental.Status = RentalStatus.Completed;
                rental.AdminActionDate = DateTime.Now;
                rental.AdminUserId = _userId;

                await _context.SaveChangesAsync();

                // Kiralamanın onaylandığını loglar.
                await LogActionAsync($"{id} ID'li kiralama tamamlandı.");

                return NoContent();
            }
            catch (Exception ex)
            {
                // Hata durumunda hata mesajını loglar ve 500 durum kodu ile hata mesajını döner.
                await LogActionAsync($"Kiralama tamamlanırken hata: {ex.Message}");
                return StatusCode(500, "Kiralama tamamlanırken hata oluştu.");
            }
        }

        // Belirli bir kiralamanın iptal edilmesi için kullanılan PUT metodu.
        [HttpPut("cancel/{id}")]
        public async Task<IActionResult> CancelRental(int id)
        {
            SetUserIdFromJwt();  // Kullanıcı ID'sini JWT'den alır ve _userId'e atar.
            try
            {
                var rental = await _context.Rentals.FindAsync(id);
                if (rental == null)
                {
                    return NotFound("Kiralama bulunamadı.");
                }

                var userRoleClaim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

                // Kullanıcı kimliği veya rolü doğru alınamadıysa, yetkilendirme hatası verir.
                if (!_userId.HasValue || string.IsNullOrEmpty(userRoleClaim))
                {
                    return Unauthorized("Kullanıcı kimliği veya rolü alınamadı.");
                }

                var allowedRoles = new List<string> { "Admin", "Superadmin" };
                // Kullanıcı yetkisi yoksa veya kiralama sahibi değilse işlemi yapma yetkisi yoktur.
                if (!allowedRoles.Contains(userRoleClaim) && rental.UserId != _userId)
                {
                    return BadRequest("Bu işlemi yapma yetkiniz yok.");
                }

                rental.Status = RentalStatus.Cancelled;
                rental.AdminActionDate = DateTime.Now;
                rental.AdminUserId = _userId;

                await _context.SaveChangesAsync();

                // Kiralamanın iptal edildiğini loglar.
                await LogActionAsync($"{id} ID'li kiralama iptal edildi.");

                return NoContent();
            }
            catch (Exception ex)
            {
                // Hata durumunda hata mesajını loglar ve 500 durum kodu ile hata mesajını döner.
                await LogActionAsync($"Kiralama iptal edilirken hata: {ex.Message}");
                return StatusCode(500, "Kiralama iptal edilirken hata oluştu.");
            }
        }

        // Bekleyen kiralamaları getirmesi için kullanılan GET metodu
        [HttpGet("pending")]
        public async Task<ActionResult<PagedResult<RentalDto>>> GetPendingRentals([FromQuery] int page = 1, [FromQuery] int pageSize = 5)
        {
            // Veritabanından kiralama verilerini sorgular, ilişkili tabloları dahil eder.
            var query = _context.Rentals
                .Include(r => r.Vehicle)
                    .ThenInclude(v => v.Model)
                        .ThenInclude(m => m.Brand)
                .Include(r => r.User)
                    .ThenInclude(u => u.UserPersonalInfo)
                .Include(r => r.User)
                    .ThenInclude(u => u.UserContactInfo)
                .Include(r => r.DepartureLocation)
                .Include(r => r.ArrivalLocation)
                .Include(r => r.AdditionalRentalProductAssignments)
                    .ThenInclude(arpa => arpa.AdditionalRentalProduct)
                .Where(r => r.Status == RentalStatus.Pending) // Yalnızca 'Bekleyen' durumundaki kiralamaları filtreler
                .AsQueryable();

            // Sorguya uyan toplam eleman sayısını hesaplar
            var totalItems = await query.CountAsync();

            // Belirtilen sayfa ve sayfa boyutu için kiralama verilerini getirir
            var rentalsList = await query
                .OrderByDescending(r => r.RentalId) // Kiralama ID'sine göre azalan sırada sıralar
                .Skip((page - 1) * pageSize) // Belirtilen sayfa numarasına göre atlar
                .Take(pageSize) // Belirtilen sayfa boyutunda verileri alır
                .ToListAsync();

            // Alınan kiralama verilerini DTO'ya dönüştürür
            var rentalDtos = rentalsList.Select(r =>
            {
                // Toplam kiralama ücretini hesaplar
                var totalPrice = (r.ReturnDate - r.RentalDate).Days * r.Vehicle.DailyRentalFee;
                totalPrice += r.AdditionalRentalProductAssignments?.Sum(ap => ap.AdditionalRentalProduct.AdditionalRentalProductFee) ?? 0;

                // Kiralama verisini DTO'ya dönüştürür
                return new RentalDto
                {
                    RentalId = r.RentalId,
                    StartDate = r.RentalDate,
                    EndDate = r.ReturnDate,
                    VehiclePlate = r.Vehicle.NumberPlate,
                    VehicleModel = r.Vehicle.Model?.ModelName ?? "Model bilgisi yok",
                    BrandName = r.Vehicle.Model?.Brand?.BrandName ?? "Marka bilgisi yok",
                    ModelYear = r.Vehicle.ModelYear,
                    CustomerName = r.User.UserPersonalInfo != null ? r.User.UserPersonalInfo.FirstName + " " + r.User.UserPersonalInfo.LastName : "Bilinmiyor",
                    DepartureLocationName = r.DepartureLocation?.LocationName ?? "Başlangıç lokasyonu yok",
                    ArrivalLocationName = r.ArrivalLocation?.LocationName ?? "Varış lokasyonu yok",
                    Status = Enum.GetName(typeof(RentalStatus), r.Status),
                    TotalPrice = totalPrice,
                    RequestDate = r.RequestDate,
                    MobilePhone = r.User.UserContactInfo?.MobilePhone ?? "Telefon bilgisi yok"
                };
            }).ToList();

            // Hazırlanan DTO listesi ve toplam eleman sayısını döndürür
            return Ok(new PagedResult<RentalDto>
            {
                Items = rentalDtos,
                TotalCount = totalItems
            });
        }

        // Tamamlanacak kiralamaları getirmesi için kullanılan GET metodu
        [HttpGet("completed")]
        public async Task<ActionResult<PagedResult<RentalDto>>> GetCompletedRentals([FromQuery] int page = 1, [FromQuery] int pageSize = 5)
        {
            var tomorrow = DateTime.Now.AddDays(2);

            // Veritabanından kiralama verilerini sorgular, ilişkili tabloları dahil eder.
            var query = _context.Rentals
                .Include(r => r.Vehicle)
                    .ThenInclude(v => v.Model)
                        .ThenInclude(m => m.Brand)
                .Include(r => r.User)
                    .ThenInclude(u => u.UserPersonalInfo)
                .Include(r => r.User)
                    .ThenInclude(u => u.UserContactInfo)
                .Include(r => r.DepartureLocation)
                .Include(r => r.ArrivalLocation)
                .Include(r => r.AdditionalRentalProductAssignments)
                    .ThenInclude(arpa => arpa.AdditionalRentalProduct)
                .Where(r => r.Status == RentalStatus.Approved && r.ReturnDate < tomorrow) // İade tarihi yaklaşan ve'Onaylı' durumdaki kiralamaları filtreler
                .AsQueryable();

            // Sorguya uyan toplam eleman sayısını hesaplar
            var totalItems = await query.CountAsync();

            // Belirtilen sayfa ve sayfa boyutu için kiralama verilerini getirir
            var rentalsList = await query
                .OrderBy(r => r.RentalDate) // Kiralama ID'sine göre azalan sırada sıralar
                .Skip((page - 1) * pageSize) // Belirtilen sayfa numarasına göre atlar
                .Take(pageSize) // Belirtilen sayfa boyutunda verileri alır
                .ToListAsync();

            // Alınan kiralama verilerini DTO'ya dönüştürür
            var rentalDtos = rentalsList.Select(r =>
            {
                // Toplam kiralama ücretini hesaplar
                var totalPrice = (r.ReturnDate - r.RentalDate).Days * r.Vehicle.DailyRentalFee;
                totalPrice += r.AdditionalRentalProductAssignments?.Sum(ap => ap.AdditionalRentalProduct.AdditionalRentalProductFee) ?? 0;

                // Kiralama verisini DTO'ya dönüştürür
                return new RentalDto
                {
                    RentalId = r.RentalId,
                    StartDate = r.RentalDate,
                    EndDate = r.ReturnDate,
                    VehiclePlate = r.Vehicle.NumberPlate,
                    VehicleModel = r.Vehicle.Model?.ModelName ?? "Model bilgisi yok",
                    BrandName = r.Vehicle.Model?.Brand?.BrandName ?? "Marka bilgisi yok",
                    ModelYear = r.Vehicle.ModelYear,
                    CustomerName = r.User.UserPersonalInfo != null ? r.User.UserPersonalInfo.FirstName + " " + r.User.UserPersonalInfo.LastName : "Bilinmiyor",
                    DepartureLocationName = r.DepartureLocation?.LocationName ?? "Başlangıç lokasyonu yok",
                    ArrivalLocationName = r.ArrivalLocation?.LocationName ?? "Varış lokasyonu yok",
                    Status = Enum.GetName(typeof(RentalStatus), r.Status),
                    TotalPrice = totalPrice,
                    RequestDate = r.RequestDate,
                    MobilePhone = r.User.UserContactInfo?.MobilePhone ?? "Telefon bilgisi yok"
                };
            }).ToList();

            // Hazırlanan DTO listesi ve toplam eleman sayısını döndürür
            return Ok(new PagedResult<RentalDto>
            {
                Items = rentalDtos,
                TotalCount = totalItems
            });
        }


        // Bekleyen kiralama sayısını dönen GET metodu.
        [HttpGet("pending-counter")]
        public async Task<ActionResult<int>> GetPendingRentalsCount()
        {
            int pendingCount = await _context.Rentals.CountAsync(r => r.Status == RentalStatus.Pending);
            return Ok(pendingCount);
        }

        // Toplam kiralama sayısını dönen GET metodu.
        [HttpGet("counter")]
        public async Task<ActionResult<int>> GetRentalsCount()
        {
            int count = await _context.Rentals.CountAsync();
            return Ok(count);
        }

        // Belirli bir kiralamanın silinmesi için kullanılan DELETE metodu.
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRental(int id)
        {
            SetUserIdFromJwt();  // Kullanıcı ID'sini JWT'den alır ve _userId'e atar.
            try
            {
                var rental = await _context.Rentals.FindAsync(id);
                if (rental == null)
                {
                    return NotFound("Kiralama bulunamadı.");
                }

                var userRole = HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;


                // Kullanıcı kimliği geçersizse yetkilendirme hatası verir.
                if (!_userId.HasValue)
                {
                    return Unauthorized("Kullanıcı kimliği geçersiz.");
                }

                bool isOwner = rental.UserId == _userId;
                bool isAdminOrSuperAdmin = userRole == "Admin" || userRole == "Superadmin";
                bool isWithinCancelPeriod = (rental.RentalDate - DateTime.Now).TotalDays > 0;

                // Eğer kiralama sahibi değilse veya iptal süresi dışındaysa işlemi yapma yetkisi yoktur.
                if (!(isOwner && isWithinCancelPeriod || isAdminOrSuperAdmin))
                {
                    return Forbid();
                }

                _context.Rentals.Remove(rental);
                await _context.SaveChangesAsync();
                // Kiralamanın silindiğini loglar.
                await LogActionAsync($"{id} ID'li kiralama silindi.");

                return NoContent();
            }
            catch (Exception ex)
            {
                // Hata durumunda hata mesajını loglar ve 500 durum kodu ile hata mesajını döner.
                await LogActionAsync($"Kiralama silinirken hata: {ex.Message}");
                return StatusCode(500, "Kiralama silinirken hata oluştu.");
            }
        }

        [HttpGet("top-rented-vehicles")]
        public async Task<ActionResult<List<Vehicle>>> GetTopRentedVehicles()
        {
            // İlk sorgu: en çok kiralanan araçların VehicleId'lerini alır
            var vehicleIds = await _context.Rentals
                .Where(r => r.Status == RentalStatus.Completed)
                .GroupBy(r => r.VehicleId)
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .Take(8)
                .ToListAsync();

            // İkinci sorgu: Bu VehicleId'lere sahip araçları ilişkili verilerle birlikte alır
            var topRentedVehicles = await _context.Vehicles
                .Where(v => vehicleIds.Contains(v.VehicleId))
                .Include(v => v.Model)
                    .ThenInclude(m => m.Brand)
                .Include(v => v.VehicleType)
                .Include(v => v.GearType)
                .Include(v => v.FuelType)
                .Include(v => v.AirConditioning)
                .Include(v => v.Color)
                .Include(v => v.VehicleImages)
                .Include(v => v.Location)
                .ToListAsync();

            if (topRentedVehicles == null || topRentedVehicles.Count == 0)
            {
                return NotFound("No rented vehicles found.");
            }

            return Ok(topRentedVehicles);
        }




        [HttpPost("payment")]
        // Ödeme bilgisi oluşturulması için kullanılan HTTP POST metodu.
        public async Task<IActionResult> CreatePayment([FromBody] PaymentDto paymentDto)
        {
            if (paymentDto == null)
            {
                return BadRequest("Ödeme bilgileri boş olamaz."); // Gelen ödeme DTO'su null ise hata mesajı döner.
            }

            if (string.IsNullOrEmpty(paymentDto.PaymentMethod) || string.IsNullOrEmpty(paymentDto.PaymentStatus))
            {
                return BadRequest("Ödeme yöntemi ve durumu boş olamaz."); // Ödeme yöntemi veya durumu boş ise hata mesajı döner.
            }

            // Ödeme bilgisini oluşturur ve veritabanına ekler.
            var payment = new Payment
            {
                RentalId = paymentDto.RentalId,
                PaymentDate = DateTime.UtcNow,
                PaymentAmount = paymentDto.PaymentAmount,
                PaymentStatus = Enum.Parse<Payment.PaymentStatuses>(paymentDto.PaymentStatus, true),
                PaymentMethod = Enum.Parse<Payment.PaymentMethods>(paymentDto.PaymentMethod, true),
                TransactionId = GenerateTransactionId() // İşlem ID'sini oluşturur.
            };

            _context.Payments.Add(payment); // Ödeme veritabanına eklenir.
            await _context.SaveChangesAsync(); // Değişiklikler veritabanına kaydedilir.

            // Başarılı ödeme bilgisi ile birlikte bir HTTP 200 OK cevabı döner.
            return Ok(new PaymentDto
            {
                PaymentId = payment.PaymentId,
                RentalId = payment.RentalId,
                PaymentDate = payment.PaymentDate,
                PaymentAmount = payment.PaymentAmount,
                PaymentStatus = payment.PaymentStatus.ToString(),
                TransactionId = payment.TransactionId,
                PaymentMethod = payment.PaymentMethod.ToString()
            });
        }

        // Bir işlem ID'si oluşturur. Her ödeme işlemi için benzersiz bir ID gereklidir.
        private string GenerateTransactionId()
        {
            return Guid.NewGuid().ToString("N").Substring(0, 12);
        }

        // Belirli bir aracın belirli tarihler arasında müsait olup olmadığını kontrol eden yardımcı metod.
        private async Task<bool> VehicleAvailable(int vehicleId, DateTime rentalDate, DateTime returnDate, int? rentalId = null)
        {
            return !await _context.Rentals.AnyAsync(r => r.VehicleId == vehicleId &&
                                                         (r.Status == RentalStatus.Approved || r.Status == RentalStatus.Pending) &&
                                                         r.RentalId != rentalId &&
                                                         r.RentalDate < returnDate &&
                                                         r.ReturnDate > rentalDate);
        }

        // Kullanıcının yaş ve ehliyet gereksinimlerini karşılayıp karşılamadığını kontrol eden yardımcı metod.
        private bool MeetsAgeAndLicenseRequirements(UserPersonalInfo personalInfo, UserLicenseInfo licenseInfo, Vehicle vehicle)
        {
            int currentYear = DateTime.Now.Year;
            int userAge = currentYear - personalInfo.DateOfBirth.Year;
            if (personalInfo.DateOfBirth > DateTime.Now.AddYears(-userAge)) userAge--;

            int licenseDuration = currentYear - licenseInfo.DriverLicenseIssueDate.Year;
            if (licenseInfo.DriverLicenseIssueDate > DateTime.Now.AddYears(-licenseDuration)) licenseDuration--;

            return userAge >= vehicle.MinDriverAge && licenseDuration >= vehicle.MinDrivingLicenseYear;
        }

        // Bu metod, güncellemenin yalnızca durum bilgisinin güncellenip güncellenmediğini belirler.
        private bool DetermineIfStatusUpdateOnly(RentalRequestModel model, Rental existingRental)
        {
            // Yalnızca durum alanının değiştirildiğini ve diğer tüm alanların mevcut kiralama detayları ile aynı kaldığını kontrol eder.
            return model.Rental.Status != existingRental.Status &&
                   model.Rental.VehicleId == existingRental.VehicleId &&
                   model.Rental.UserId == existingRental.UserId &&
                   model.Rental.RentalDate == existingRental.RentalDate &&
                   model.Rental.ReturnDate == existingRental.ReturnDate &&
                   model.Rental.DepartureLocationId == existingRental.DepartureLocationId &&
                   model.Rental.ArrivalLocationId == existingRental.ArrivalLocationId;
        }

        // Bir kiralamanın veritabanında mevcut olup olmadığını kontrol eden yardımcı metod.
        private bool RentalExists(int id)
        {
            return _context.Rentals.Any(e => e.RentalId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
