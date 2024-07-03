using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/locations' altında yer alacak.
    [Route("api/locations")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class LocationsController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir.
        public LocationsController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm lokasyonları listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<Location>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Location>>> GetLocations()
        {
            // Veritabanından tüm Locations'ı asenkron olarak listeler ve döner.
            return await _context.Locations.ToListAsync();
        }

        // Belirli bir ID'ye sahip lokasyonu getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<Location>> GetLocation(int id)
        {
            // Veritabanında belirtilen ID'ye sahip lokasyonu asenkron olarak bulur. Bulamazsa null döner.
            var location = await _context.Locations.FindAsync(id);

            // location null ise NotFound (HTTP 404) döner, değilse lokasyonu döner.
            if (location == null)
            {
                return NotFound(); // Lokasyon bulunamazsa 404 hatası döner
            }

            return location; // Lokasyon bulunduysa lokasyonu döner
        }

        // Yeni bir lokasyon ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<Location>> PostLocation(Location location)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.Locations.Add(location); // Yeni lokasyonu veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni lokasyon eklendi: {location.LocationName} (ID: {location.LocationId})");

                // Başarılı ekleme işleminden sonra lokasyonun detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction(nameof(GetLocation), new { id = location.LocationId }, location);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Lokasyon eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Lokasyon eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip lokasyonu günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLocation(int id, Location location)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != location.LocationId)
            {
                return BadRequest(); // Eğer gönderilen ID ile lokasyonun ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde lokasyonun durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(location).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Lokasyon güncellendi: {location.LocationName} (ID: {location.LocationId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!LocationExists(id)) // Lokasyon veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan lokasyon bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Lokasyon güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Lokasyon güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Lokasyon güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Lokasyon güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip lokasyonu siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen lokasyonu veritabanından bulur. Bulamazsa null döner.
                var location = await _context.Locations.FindAsync(id);
                if (location == null) // Lokasyon bulunamazsa
                {
                    // Lokasyon bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Lokasyon silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Lokasyonu veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.Locations.Remove(location);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Lokasyon silindi: {location.LocationName} (ID: {location.LocationId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Lokasyon silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Lokasyon silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip lokasyonun veritabanında olup olmadığını kontrol eder.
        private bool LocationExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip lokasyonun olup olmadığını kontrol eder.
            return _context.Locations.Any(e => e.LocationId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
