using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/additional-rental-products' altında yer alacak.
    [Route("api/additional-rental-products")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class AdditionalRentalProductController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir. 
        public AdditionalRentalProductController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm ek kiralama ürünlerini listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<AdditionalRentalProduct>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdditionalRentalProduct>>> GetAdditionalRentalProducts()
        {
            // Veritabanından tüm AdditionalRentalProducts'ı asenkron olarak listeler ve döner.
            return await _context.AdditionalRentalProducts.ToListAsync();
        }

        // Belirli bir ID'ye sahip ek kiralama ürününü getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<AdditionalRentalProduct>> GetAdditionalRentalProduct(int id)
        {
            // Veritabanında belirtilen ID'ye sahip ürünü asenkron olarak bulur. Bulamazsa null döner.
            var additionalRentalProduct = await _context.AdditionalRentalProducts.FindAsync(id);
            // additionalRentalProduct null ise NotFound (HTTP 404) döner, değilse ürünü döner.
            if (additionalRentalProduct == null)
            {
                return NotFound(); // Ürün bulunamazsa 404 hatası döner
            }
            return additionalRentalProduct;
        }

        // Yeni bir ek kiralama ürünü ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<AdditionalRentalProduct>> PostAdditionalRentalProduct(AdditionalRentalProduct additionalRentalProduct)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.AdditionalRentalProducts.Add(additionalRentalProduct); // Yeni ürünü veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni ek kiralama ürünü eklendi: {additionalRentalProduct.AdditionalRentalProductName} (ID: {additionalRentalProduct.AdditionalRentalProductId})");

                // Başarılı ekleme işleminden sonra ürünün detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction(nameof(GetAdditionalRentalProduct), new { id = additionalRentalProduct.AdditionalRentalProductId }, additionalRentalProduct);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Ek kiralama ürünü eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Ek kiralama ürünü eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip ek kiralama ürününü günceller. İşlemi yine belirli rollerdeki kullanıcılar yapabilir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAdditionalRentalProduct(int id, AdditionalRentalProduct additionalRentalProduct)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != additionalRentalProduct.AdditionalRentalProductId)
            {
                return BadRequest(); // Eğer gönderilen ID ile ürünün ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde ürünün durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(additionalRentalProduct).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Ek kiralama ürünü güncellendi: {additionalRentalProduct.AdditionalRentalProductName} (ID: {additionalRentalProduct.AdditionalRentalProductId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!AdditionalRentalProductExists(id)) // Ürün veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan ürün bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Ek kiralama ürünü güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Ek kiralama ürünü güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Ek kiralama ürünü güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Ek kiralama ürünü güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip ek kiralama ürününü siler. İşlemi yine belirli rollerdeki kullanıcılar yapabilir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAdditionalRentalProduct(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen ürünü veritabanından bulur. Bulamazsa null döner.
                var additionalRentalProduct = await _context.AdditionalRentalProducts.FindAsync(id);
                if (additionalRentalProduct == null) // Ürün bulunamazsa
                {
                    // Ürün bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Ek kiralama ürünü silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Ürünü veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.AdditionalRentalProducts.Remove(additionalRentalProduct);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Ek kiralama ürünü silindi: {additionalRentalProduct.AdditionalRentalProductName} (ID: {additionalRentalProduct.AdditionalRentalProductId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Ek kiralama ürünü silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Ek kiralama ürünü silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir kiralama ID'sine göre ek ürünleri listeler. Bu işlem için kullanıcı girişi gerekli değildir.
        [HttpGet("by-rental/{rentalId}")]
        public async Task<ActionResult<IEnumerable<AdditionalRentalProduct>>> GetAdditionalProductsForRental(int rentalId)
        {
            // Kiralama ID'sine göre ek ürünleri filtreleyerek ve ilişkili ek ürün bilgilerini dahil ederek asenkron olarak listeler.
            var additionalProducts = await _context.AdditionalRentalProductAssignments
                .Where(x => x.RentalId == rentalId)
                .Include(x => x.AdditionalRentalProduct)
                .Select(x => x.AdditionalRentalProduct)
                .ToListAsync();

            return Ok(additionalProducts); // Ürünler başarıyla bulunduysa Ok (HTTP 200) ile ürün listesini döner.
        }

        // Belirli bir ID'ye sahip ek kiralama ürününün veritabanında olup olmadığını kontrol eder.
        private bool AdditionalRentalProductExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip ek kiralama ürününün olup olmadığını kontrol eder.
            return _context.AdditionalRentalProducts.Any(e => e.AdditionalRentalProductId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
