using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/vehicle-features' altında yer alacak.
    [Route("api/vehicle-features")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class VehicleFeaturesController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir.
        public VehicleFeaturesController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm araç özelliklerini listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<VehicleFeature>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VehicleFeature>>> GetVehicleFeatures()
        {
            // Veritabanından tüm VehicleFeature'leri asenkron olarak listeler ve döner.
            return await _context.VehicleFeatures.ToListAsync();
        }

        // Belirli bir ID'ye sahip araç özelliğini getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<VehicleFeature>> GetVehicleFeature(int id)
        {
            // Veritabanında belirtilen ID'ye sahip araç özelliğini asenkron olarak bulur. Bulamazsa null döner.
            var vehicleFeature = await _context.VehicleFeatures.FindAsync(id);

            // vehicleFeature null ise NotFound (HTTP 404) döner, değilse araç özelliğini döner.
            if (vehicleFeature == null)
            {
                return NotFound(); // Araç özelliği bulunamazsa 404 hatası döner
            }

            return vehicleFeature; // Araç özelliği bulunduysa araç özelliğini döner
        }

        // Yeni bir araç özelliği ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<VehicleFeature>> PostVehicleFeature(VehicleFeature vehicleFeature)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.VehicleFeatures.Add(vehicleFeature); // Yeni araç özelliğini veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni araç özelliği eklendi: {vehicleFeature.VehicleFeatureName} (ID: {vehicleFeature.VehicleFeatureId})");

                // Başarılı ekleme işleminden sonra araç özelliğinin detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction("GetVehicleFeature", new { id = vehicleFeature.VehicleFeatureId }, vehicleFeature);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç özelliği eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç özelliği eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip araç özelliğini günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehicleFeature(int id, VehicleFeature vehicleFeature)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != vehicleFeature.VehicleFeatureId)
            {
                return BadRequest(); // Eğer gönderilen ID ile araç özelliğinin ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde araç özelliğinin durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(vehicleFeature).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Araç özelliği güncellendi: {vehicleFeature.VehicleFeatureName} (ID: {vehicleFeature.VehicleFeatureId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!VehicleFeatureExists(id)) // Araç özelliği veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan araç özelliği bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Araç özelliği güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Araç özelliği güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç özelliği güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç özelliği güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip araç özelliğini siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicleFeature(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen araç özelliğini veritabanından bulur. Bulamazsa null döner.
                var vehicleFeature = await _context.VehicleFeatures.FindAsync(id);
                if (vehicleFeature == null) // Araç özelliği bulunamazsa
                {
                    // Araç özelliği bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Araç özelliği silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Araç özelliğini veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.VehicleFeatures.Remove(vehicleFeature);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Araç özelliği silindi: {vehicleFeature.VehicleFeatureName} (ID: {vehicleFeature.VehicleFeatureId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç özelliği silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç özelliği silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip araç özelliğinin veritabanında olup olmadığını kontrol eder.
        private bool VehicleFeatureExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip araç özelliğinin olup olmadığını kontrol eder.
            return _context.VehicleFeatures.Any(e => e.VehicleFeatureId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
