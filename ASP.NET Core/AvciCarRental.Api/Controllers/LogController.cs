using AvciCarRental.Api.DTOs;
using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static AvciCarRental.Api.Controllers.UsersController;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace AvciCarRental.Api.Controllers
{
    // Bu sınıf, API üzerinden log kayıtlarının yönetilmesi için kullanılır.
    [Route("api/logs")]
    // Bu sınıfın bir API controller olduğunu ve otomatik model doğrulama işlemlerinin uygulanmasını sağlar.
    [ApiController]
    public class LogController : ControllerBase
    {
        // Veritabanı bağlamını (_context) tutar. Bu field sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;

        // Constructor. Dependency injection ile veritabanı bağlamı enjekte edilir.
        public LogController(AvciCarRentalDbContext context)
        {
            _context = context; // Enjekte edilen veritabanı bağlamını _context değişkenine ata.
        }

        // Bu metod, belirli yetkilere sahip kullanıcılar için log kayıtlarını listeler.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpGet]
        public async Task<ActionResult<PagedResult<Log>>> GetLogs(
            [FromQuery] int page = 1, // Sorgu parametresi olarak sayfa numarası. Varsayılan değer 1'dir.
            [FromQuery] int pageSize = 10, // Sorgu parametresi olarak sayfa başına düşen kayıt sayısı. Varsayılan değer 10'dur.
            [FromQuery] string searchQuery = "") // Sorgu parametresi olarak arama sorgusu. Varsayılan değer boş bir string'dir.
        {
            // Logları IQueryable olarak alır. Bu, veritabanı sorgularının daha sonra şekillendirilmesine izin verir.
            var logs = _context.Logs.AsQueryable();

            // Arama sorgusu boş değilse, UserId ve Action alanları üzerinden filtreleme yapar.
            if (!string.IsNullOrEmpty(searchQuery))
            {
                logs = logs.Where(r =>
                    r.UserId.ToString().Contains(searchQuery) || // UserId'yi string'e çevirip arama sorgusu içinde arar.
                    r.Action.Contains(searchQuery) // Action alanında arama sorgusunu arar.
                );
            }

            // Filtrelenmiş log kayıtlarının toplam sayısını hesaplar. Bu değer sayfalama için kullanılır.
            var totalCount = await logs.CountAsync();

            // Log kayıtlarını en son yapılan aksiyona göre tersten sıralar.
            logs = logs.OrderByDescending(e => e.ActionDate);

            // Sayfalama işlemini uygular.
            var pagedLogs = await logs
                .Skip((page - 1) * pageSize) // Önceki sayfalardaki kayıtları atlar.
                .Take(pageSize) // Bu sayfaya ait kayıtları alır.
                .ToListAsync();

            // Sayfalama sonucunu oluşturur. İçerisinde bu sayfadaki kayıtlar ve toplam kayıt sayısı bulunur.
            var pagedResult = new PagedResult<Log>
            {
                Items = pagedLogs,
                TotalCount = totalCount
            };

            // Sayfalama sonucunu HTTP 200 ile döner.
            return Ok(pagedResult);
        }
    }
}
