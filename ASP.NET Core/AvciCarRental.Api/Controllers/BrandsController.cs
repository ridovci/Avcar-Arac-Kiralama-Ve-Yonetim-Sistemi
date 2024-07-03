using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/brands' altında yer alacak.
    [Route("api/brands")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class BrandsController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir. 
        public BrandsController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm markaları listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<Brand>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Brand>>> GetBrands()
        {
            // Veritabanından tüm Brand'leri asenkron olarak listeler ve döner.
            return await _context.Brands.ToListAsync();
        }

        // Belirli bir ID'ye sahip markayı getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<Brand>> GetBrand(int id)
        {
            // Veritabanında belirtilen ID'ye sahip markayı asenkron olarak bulur. Bulamazsa null döner.
            var brand = await _context.Brands.FindAsync(id);

            // brand null ise NotFound (HTTP 404) döner, değilse markayı döner.
            if (brand == null)
            {
                return NotFound(); // Marka bulunamazsa 404 hatası döner
            }

            return brand; // Marka bulunduysa markayı döner
        }

        // Yeni bir marka ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<Brand>> PostBrand(Brand brand)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.Brands.Add(brand); // Yeni markayı veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni marka eklendi: {brand.BrandName} (ID: {brand.BrandId})");

                // Başarılı ekleme işleminden sonra markanın detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction(nameof(GetBrand), new { id = brand.BrandId }, brand);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Marka eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Marka eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip markayı günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBrand(int id, Brand brand)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != brand.BrandId)
            {
                return BadRequest(); // Eğer gönderilen ID ile markanın ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde markanın durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(brand).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Marka güncellendi: {brand.BrandName} (ID: {brand.BrandId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!BrandExists(id)) // Marka veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan marka bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Marka güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Marka güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Marka güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Marka güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip markayı siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBrand(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen markayı veritabanından bulur. Bulamazsa null döner.
                var brand = await _context.Brands.FindAsync(id);
                if (brand == null) // Marka bulunamazsa
                {
                    // Marka bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Marka silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Markayı veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.Brands.Remove(brand);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Marka silindi: {brand.BrandName} (ID: {brand.BrandId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Marka silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Marka silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip markanın veritabanında olup olmadığını kontrol eder.
        private bool BrandExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip markanın olup olmadığını kontrol eder.
            return _context.Brands.Any(e => e.BrandId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
