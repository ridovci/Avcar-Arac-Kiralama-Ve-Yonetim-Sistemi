using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/air-conditionings' altında yer alacak.
    [Route("api/air-conditionings")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class AirConditioningController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir. 
        public AirConditioningController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm klimaları listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<AirConditioning>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AirConditioning>>> GetAirConditionings()
        {
            // Veritabanından tüm AirConditionings'ı asenkron olarak listeler ve döner.
            return await _context.AirConditionings.ToListAsync();
        }

        // Belirli bir ID'ye sahip klimayı getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<AirConditioning>> GetAirConditioning(int id)
        {
            // Veritabanında belirtilen ID'ye sahip ürünü asenkron olarak bulur. Bulamazsa null döner.
            var airConditioning = await _context.AirConditionings.FindAsync(id);
            // airConditioning null ise NotFound (HTTP 404) döner, değilse ürünü döner.
            if (airConditioning == null)
            {
                return NotFound(); // Ürün bulunamazsa 404 hatası döner
            }
            return airConditioning;
        }

        // Yeni bir klima ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<AirConditioning>> PostAirConditioning(AirConditioning airConditioning)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.AirConditionings.Add(airConditioning); // Yeni ürünü veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni klima eklendi: {airConditioning.AirConditioningName} (ID: {airConditioning.AirConditioningId})");

                // Başarılı ekleme işleminden sonra ürünün detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction(nameof(GetAirConditioning), new { id = airConditioning.AirConditioningId }, airConditioning);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Klima eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Klima eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip klimayı günceller. İşlemi yine belirli rollerdeki kullanıcılar yapabilir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAirConditioning(int id, AirConditioning airConditioning)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != airConditioning.AirConditioningId)
            {
                return BadRequest(); // Eğer gönderilen ID ile ürünün ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde ürünün durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(airConditioning).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Klima güncellendi: {airConditioning.AirConditioningName} (ID: {airConditioning.AirConditioningId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!AirConditioningExists(id)) // Ürün veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan ürün bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Klima güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Klima güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Klima güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Klima güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip klimayı siler. İşlemi yine belirli rollerdeki kullanıcılar yapabilir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAirConditioning(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen ürünü veritabanından bulur. Bulamazsa null döner.
                var airConditioning = await _context.AirConditionings.FindAsync(id);
                if (airConditioning == null) // Ürün bulunamazsa
                {
                    // Ürün bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Klima silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Ürünü veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.AirConditionings.Remove(airConditioning);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Klima silindi: {airConditioning.AirConditioningName} (ID: {airConditioning.AirConditioningId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Klima silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Klima silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip klimanın veritabanında olup olmadığını kontrol eder.
        private bool AirConditioningExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip klimanın olup olmadığını kontrol eder.
            return _context.AirConditionings.Any(e => e.AirConditioningId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
