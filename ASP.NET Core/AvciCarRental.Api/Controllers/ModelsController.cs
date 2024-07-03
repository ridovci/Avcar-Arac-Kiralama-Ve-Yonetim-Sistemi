using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/models' altında yer alacak.
    [Route("api/models")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class ModelsController : ControllerBase
    {
        // Veritabanı bağlamını (_context) ve loglama servisini (_loggingService) tutar. Bu field'lar sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini nullable int tipinde tutar. Eğer kullanıcı girişi yapılmamışsa null olabilir.

        // Constructor. Dependency injection ile veritabanı bağlamı ve loglama servisi enjekte edilir.
        public ModelsController(AvciCarRentalDbContext context, LoggingService loggingService)
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

        // Tüm modelleri listeler. Asenkron bir metod olduğu için Task<ActionResult<IEnumerable<Model>>> tipinde bir değer döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Model>>> GetModels()
        {
            // Veritabanından tüm Model'leri asenkron olarak listeler ve döner.
            return await _context.Models.ToListAsync();
        }

        // Belirli bir ID'ye sahip modeli getirir. ID, HTTP isteğinin URL'sinden alınır.
        [HttpGet("{id}")]
        public async Task<ActionResult<Model>> GetModel(int id)
        {
            // Veritabanında belirtilen ID'ye sahip modeli asenkron olarak bulur. Bulamazsa null döner.
            var model = await _context.Models.FindAsync(id);

            // model null ise NotFound (HTTP 404) döner, değilse modeli döner.
            if (model == null)
            {
                return NotFound(); // Model bulunamazsa 404 hatası döner
            }

            return model; // Model bulunduysa modeli döner
        }

        // Belirli bir marka ID'sine göre modelleri getirir. Marka ID'si, HTTP isteğinin query string'inden alınır.
        [HttpGet("by-brand")]
        public async Task<ActionResult<IEnumerable<Model>>> GetModelsByBrandId([FromQuery] int brandId)
        {
            // Veritabanında belirtilen marka ID'sine sahip modelleri asenkron olarak bulur ve listeler.
            var models = await _context.Models.Where(m => m.BrandId == brandId).ToListAsync();

            // models null ise veya boşsa NotFound (HTTP 404) döner.
            if (models == null || !models.Any())
            {
                return NotFound(); // Model bulunamazsa 404 hatası döner
            }

            return models; // Modeller bulunduysa modelleri döner
        }

        // Yeni bir model ekler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPost]
        public async Task<ActionResult<Model>> PostModel(Model model)
        {
            SetUserIdFromJwt(); // Kullanıcı ID'sini JWT'den alır ve _userId'i ayarlar.
            try
            {
                _context.Models.Add(model); // Yeni modeli veritabanına ekler.
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Loglama servisini kullanarak ekleme işlemini loglar.
                await LogActionAsync($"Yeni model eklendi: {model.ModelName} (ID: {model.ModelId})");

                // Başarılı ekleme işleminden sonra modelin detaylarının görüntülenebileceği URL ile birlikte 201 Created durum kodu döner.
                return CreatedAtAction("GetModel", new { id = model.ModelId }, model);
            }
            catch (Exception ex)
            {
                // Ekleme sırasında hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Model eklenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Model eklenirken bir hata oluştu.");
            }
        }

        // Belirli bir ID'ye sahip modeli günceller. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutModel(int id, Model model)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            if (id != model.ModelId)
            {
                return BadRequest(); // Eğer gönderilen ID ile modelin ID'si eşleşmiyorsa BadRequest (HTTP 400) döner.
            }

            // EF Core context üzerinde modelin durumunu Modified (değiştirilmiş) olarak işaretler. Bu, sonraki SaveChangesAsync çağrısında güncellenmesini sağlar.
            _context.Entry(model).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.
                // Güncelleme işlemini loglar.
                await LogActionAsync($"Model güncellendi: {model.ModelName} (ID: {model.ModelId})");
            }
            catch (DbUpdateConcurrencyException ex) // Eşzamanlılık hatası oluşursa
            {
                if (!ModelExists(id)) // Model veritabanında mevcut değilse
                {
                    // Güncellenmeye çalışılan model bulunamadıysa loglar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Model güncellenirken bulunamadı: ID {id}");
                    return NotFound();
                }
                else
                {
                    // Diğer eşzamanlılık hatalarında hata detayını loglar ve hatayı yükseltir.
                    await LogActionAsync($"Model güncellenirken bir hata oluştu: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex) // Diğer hatalar için
            {
                // Güncelleme işlemi sırasında beklenmedik bir hata oluşursa loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Model güncellenirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Model güncellenirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı güncelleme sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip modeli siler. Bu işlemi yapabilmek için kullanıcının belirli rollerde olması gerekir.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteModel(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve _userId'i ayarlar.
            try
            {
                // Silinmek istenen modeli veritabanından bulur. Bulamazsa null döner.
                var model = await _context.Models.FindAsync(id);
                if (model == null) // Model bulunamazsa
                {
                    // Model bulunamadığı için loglama yapar ve NotFound (HTTP 404) döner.
                    await LogActionAsync($"Model silinirken bulunamadı: ID {id}");
                    return NotFound();
                }

                // Modeli veritabanı context'inden kaldırır. Bu, sonraki SaveChangesAsync çağrısında silinmesini sağlar.
                _context.Models.Remove(model);
                await _context.SaveChangesAsync(); // Değişiklikleri veritabanına kaydeder.

                // Silme işlemini loglar.
                await LogActionAsync($"Model silindi: {model.ModelName} (ID: {model.ModelId})");
            }
            catch (Exception ex) // Silme işlemi sırasında hata oluşursa
            {
                // Hata oluştuğunu loglar ve 500 Internal Server Error döner.
                await LogActionAsync($"Model silinirken bir hata oluştu: {ex.Message}");
                return StatusCode(500, "Model silinirken bir hata oluştu.");
            }

            return NoContent(); // Başarılı silme işlemi sonrası NoContent (HTTP 204) durum kodu döner.
        }

        // Belirli bir ID'ye sahip modelin veritabanında olup olmadığını kontrol eder.
        private bool ModelExists(int id)
        {
            // Veritabanında belirtilen ID'ye sahip modelin olup olmadığını kontrol eder.
            return _context.Models.Any(e => e.ModelId == id);
        }

        // Verilen aksiyon hakkında loglama yapar.
        private async Task LogActionAsync(string action)
        {
            // Loglama servisini kullanarak, geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }
    }
}
