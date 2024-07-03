using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/gear-types' altında yer alacak.
    [Route("api/gear-types")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class GearTypesController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir.
        public GearTypesController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm vites tiplerini listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<GearType>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GearType>>> GetGearTypes()
        {
            // Veritabanından tüm GearTypes'ı asenkron olarak listeler ve döner.
            return await _context.GearTypes.ToListAsync();
        }

        // Belirli bir ID'ye sahip vites tipini getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<GearType>> GetGearType(int id)
        {
            // Veritabanında belirtilen ID'ye sahip vites tipini asenkron olarak bulur. Bulamazsa null döner.
            var gearType = await _context.GearTypes.FindAsync(id);

            // gearType null ise NotFound (HTTP 404) döner, değilse vites tipini döner.
            if (gearType == null)
            {
                return NotFound(); // Vites tipi bulunamazsa 404 hatası döner
            }

            return gearType; // Vites tipi bulunduysa vites tipini döner
        }

        // Yeni bir vites tipi ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<GearType>> PostGearType(GearType gearType)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.GearTypes.Add(gearType); // Yeni vites tipini veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni vites tipi eklendi: {gearType.GearTypeName} (ID: {gearType.GearTypeId})");

                // Başarılı ekleme işleminden sonra vites tipinin detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction("GetGearType", new { id = gearType.GearTypeId }, gearType);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Vites tipi eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Vites tipi eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip vites tipini günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutGearType(int id, GearType gearType)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != gearType.GearTypeId)
            {
                return BadRequest(); // Eğer gönderilen ID ile vites tipinin ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde vites tipinin durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(gearType).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Vites tipi güncellendi: {gearType.GearTypeName} (ID: {gearType.GearTypeId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!GearTypeExists(id)) // Vites tipi veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan vites tipi bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Vites tipi güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Vites tipi güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Vites tipi güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Vites tipi güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip vites tipini siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGearType(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen vites tipini veritabanından bulur. Bulamazsa null döner.
                var gearType = await _context.GearTypes.FindAsync(id);
                if (gearType == null) // Vites tipi bulunamazsa
                {
                    // Vites tipi bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Vites tipi silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Vites tipini veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.GearTypes.Remove(gearType);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Vites tipi silindi: {gearType.GearTypeName} (ID: {gearType.GearTypeId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Vites tipi silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Vites tipi silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip vites tipinin veritabanında olup olmadığını kontrol eder.
        private bool GearTypeExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip vites tipinin olup olmadığını kontrol eder.
            return _context.GearTypes.Any(e => e.GearTypeId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
