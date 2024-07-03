using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/fuel-types' altında yer alacak.
    [Route("api/fuel-types")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class FuelTypesController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir. 
        public FuelTypesController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm yakıt tiplerini listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<FuelType>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FuelType>>> GetFuelTypes()
        {
            // Veritabanından tüm FuelTypes'ı asenkron olarak listeler ve döner.
            return await _context.FuelTypes.ToListAsync();
        }

        // Belirli bir ID'ye sahip yakıt tipini getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<FuelType>> GetFuelType(int id)
        {
            // Veritabanında belirtilen ID'ye sahip yakıt tipini asenkron olarak bulur. Bulamazsa null döner.
            var fuelType = await _context.FuelTypes.FindAsync(id);

            // fuelType null ise NotFound (HTTP 404) döner, değilse yakıt tipini döner.
            if (fuelType == null)
            {
                return NotFound(); // Yakıt tipi bulunamazsa 404 hatası döner
            }

            return fuelType; // Yakıt tipi bulunduysa yakıt tipini döner
        }

        // Yeni bir yakıt tipi ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<FuelType>> PostFuelType(FuelType fuelType)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.FuelTypes.Add(fuelType); // Yeni yakıt tipini veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni yakıt tipi eklendi: {fuelType.FuelTypeName} (ID: {fuelType.FuelTypeId})");

                // Başarılı ekleme işleminden sonra yakıt tipinin detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction("GetFuelType", new { id = fuelType.FuelTypeId }, fuelType);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Yakıt tipi eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Yakıt tipi eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip yakıt tipini günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFuelType(int id, FuelType fuelType)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != fuelType.FuelTypeId)
            {
                return BadRequest(); // Eğer gönderilen ID ile yakıt tipinin ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde yakıt tipinin durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(fuelType).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Yakıt tipi güncellendi: {fuelType.FuelTypeName} (ID: {fuelType.FuelTypeId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!FuelTypeExists(id)) // Yakıt tipi veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan yakıt tipi bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Yakıt tipi güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Yakıt tipi güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Yakıt tipi güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Yakıt tipi güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip yakıt tipini siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFuelType(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen yakıt tipini veritabanından bulur. Bulamazsa null döner.
                var fuelType = await _context.FuelTypes.FindAsync(id);
                if (fuelType == null) // Yakıt tipi bulunamazsa
                {
                    // Yakıt tipi bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Yakıt tipi silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Yakıt tipini veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.FuelTypes.Remove(fuelType);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Yakıt tipi silindi: {fuelType.FuelTypeName} (ID: {fuelType.FuelTypeId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Yakıt tipi silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Yakıt tipi silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip yakıt tipinin veritabanında olup olmadığını kontrol eder.
        private bool FuelTypeExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip yakıt tipinin olup olmadığını kontrol eder.
            return _context.FuelTypes.Any(e => e.FuelTypeId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
