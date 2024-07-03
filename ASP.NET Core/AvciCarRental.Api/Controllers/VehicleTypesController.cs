using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/vehicle-types' altında yer alacak.
    [Route("api/vehicle-types")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class VehicleTypesController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir.
        public VehicleTypesController(AvciCarRentalDbContext context, LoggingService loggingService)
        {
            _context = context; // Enjekte edilen veritabanı bağlamını _context değişkenine ata.
            _loggingService = loggingService; // Enjekte edilen loglama servisini _loggingService değişkenine ata.
        }

        // JWT (JSON Web Token) içerisinden kullanıcı ID'sini çeker ve _userId field'ına atar.
        private void SetUserIdFromJwt()
        {
            // HttpContext.User.Claims koleksiyonunu dolaşarak 'id' tipindeki claim'i bulur. Bulamazsa null döner.
            var userIdClaim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            // userIdClaim null değilse ve integer'a çevrilebiliyorsa _userId'e atar, değilse _userId null olur.
            _userId = !string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId) ? userId : (int?)null;
        }

        // Tüm araç tiplerini listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<VehicleType>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VehicleType>>> GetVehicleTypes()
        {
            // Veritabanından tüm VehicleType'ları asenkron olarak listeler ve döner.
            return await _context.VehicleTypes.ToListAsync();
        }

        // Belirli bir ID'ye sahip araç tipini getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<VehicleType>> GetVehicleType(int id)
        {
            // Veritabanında belirtilen ID'ye sahip araç tipini asenkron olarak bulur. Bulamazsa null döner.
            var vehicleType = await _context.VehicleTypes.FindAsync(id);

            // vehicleType null ise NotFound (HTTP 404) döner, değilse araç tipini döner.
            if (vehicleType == null)
            {
                return NotFound(); // Araç tipi bulunamazsa 404 hatası döner
            }

            return vehicleType; // Araç tipi bulunduysa araç tipini döner
        }

        // Yeni bir araç tipi ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<VehicleType>> PostVehicleType(VehicleType vehicleType)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.VehicleTypes.Add(vehicleType); // Yeni araç tipini veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni araç tipi eklendi: {vehicleType.VehicleTypeName} (ID: {vehicleType.VehicleTypeId})");

                // Başarılı ekleme işleminden sonra araç tipinin detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction("GetVehicleType", new { id = vehicleType.VehicleTypeId }, vehicleType);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç tipi eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç tipi eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip araç tipini günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehicleType(int id, VehicleType vehicleType)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != vehicleType.VehicleTypeId)
            {
                return BadRequest(); // Eğer gönderilen ID ile araç tipinin ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde araç tipinin durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(vehicleType).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Araç tipi güncellendi: {vehicleType.VehicleTypeName} (ID: {vehicleType.VehicleTypeId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!VehicleTypeExists(id)) // Araç tipi veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan araç tipi bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Araç tipi güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Araç tipi güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç tipi güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç tipi güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip araç tipini siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicleType(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen araç tipini veritabanından bulur. Bulamazsa null döner.
                var vehicleType = await _context.VehicleTypes.FindAsync(id);
                if (vehicleType == null) // Araç tipi bulunamazsa
                {
                    // Araç tipi bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Araç tipi silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Araç tipini veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.VehicleTypes.Remove(vehicleType);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Araç tipi silindi: {vehicleType.VehicleTypeName} (ID: {vehicleType.VehicleTypeId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç tipi silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç tipi silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip araç tipinin veritabanında olup olmadığını kontrol eder.
        private bool VehicleTypeExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip araç tipinin olup olmadığını kontrol eder.
            return _context.VehicleTypes.Any(e => e.VehicleTypeId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
