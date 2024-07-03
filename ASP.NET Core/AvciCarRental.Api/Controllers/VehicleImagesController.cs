using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/vehicle-images' altında yer alacak.
    [Route("api/vehicle-images")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class VehicleImagesController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir.
        public VehicleImagesController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm araç resimlerini listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<VehicleImage>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VehicleImage>>> GetVehicleImages()
        {
            // Veritabanından tüm VehicleImage'ları asenkron olarak listeler ve döner.
            return await _context.VehicleImages.ToListAsync();
        }

        // Belirli bir ID'ye sahip araç resmini getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<VehicleImage>> GetVehicleImage(int id)
        {
            // Veritabanında belirtilen ID'ye sahip araç resmini asenkron olarak bulur. Bulamazsa null döner.
            var vehicleImage = await _context.VehicleImages.FindAsync(id);

            // vehicleImage null ise NotFound (HTTP 404) döner, değilse araç resmini döner.
            if (vehicleImage == null)
            {
                return NotFound(); // Araç resmi bulunamazsa 404 hatası döner
            }

            return vehicleImage; // Araç resmi bulunduysa araç resmini döner
        }

        // Yeni bir araç resmi ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<VehicleImage>> PostVehicleImage(VehicleImage vehicleImage)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.VehicleImages.Add(vehicleImage); // Yeni araç resmini veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni araç resmi eklendi: {vehicleImage.VehicleImageUrl} (ID: {vehicleImage.VehicleImageId})");

                // Başarılı ekleme işleminden sonra araç resminin detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction("GetVehicleImage", new { id = vehicleImage.VehicleImageId }, vehicleImage);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç resmi eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç resmi eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip araç resmini günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehicleImage(int id, VehicleImage vehicleImage)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != vehicleImage.VehicleImageId)
            {
                return BadRequest(); // Eğer gönderilen ID ile araç resminin ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde araç resminin durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(vehicleImage).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Araç resmi güncellendi: {vehicleImage.VehicleImageUrl} (ID: {vehicleImage.VehicleImageId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!VehicleImageExists(id)) // Araç resmi veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan araç resmi bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Araç resmi güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Araç resmi güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç resmi güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç resmi güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip araç resmini siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicleImage(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen araç resmini veritabanından bulur. Bulamazsa null döner.
                var vehicleImage = await _context.VehicleImages.FindAsync(id);
                if (vehicleImage == null) // Araç resmi bulunamazsa
                {
                    // Araç resmi bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Araç resmi silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Araç resmini veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.VehicleImages.Remove(vehicleImage);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Araç resmi silindi: {vehicleImage.VehicleImageUrl} (ID: {vehicleImage.VehicleImageId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Araç resmi silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Araç resmi silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip araç resminin veritabanında olup olmadığını kontrol eder.
        private bool VehicleImageExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip araç resminin olup olmadığını kontrol eder.
            return _context.VehicleImages.Any(e => e.VehicleImageId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
