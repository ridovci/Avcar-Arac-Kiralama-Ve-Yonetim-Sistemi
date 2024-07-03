using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using System.Net;

namespace AvciCarRental.Api.Services
{
    // LoggingService sınıfı, log kaydı işlemleri için kullanılır.
    public class LoggingService
    {
        // Veritabanı bağlamını tutan private bir field.
        private readonly AvciCarRentalDbContext _context;

        // Constructor metodu ile bağımlılıkların enjekte edilmesi. 
        public LoggingService(AvciCarRentalDbContext context)
        {
            _context = context;  // Veritabanı bağlamının atanması
        }

        // Asenkron bir metot olan LogActionAsync, log kaydı oluşturur.
        public async Task LogActionAsync(int? userId, string action, HttpContext httpContext)
        {
            // Kullanıcının IP adresini HttpContext üzerinden almak için GetClientIpAddress metodunu çağırır.
            var clientIpAddress = GetClientIpAddress(httpContext);

            // Log nesnesi oluşturulur ve gerekli bilgiler atanır.
            var log = new Log
            {
                UserId = userId,  // Log kaydının hangi kullanıcıya ait olduğu
                Action = action,  // Gerçekleştirilen eylem
                IpAddress = clientIpAddress,  // Kullanıcının IP adresi
                ActionDate = DateTime.Now  // Log kaydının oluşturulduğu tarih ve saat
            };

            // Log nesnesi veritabanına eklenir.
            _context.Logs.Add(log);
            // Değişikliklerin veritabanına kaydedilmesi.
            await _context.SaveChangesAsync();
        }

        // IP adresi doğrudan parametre olarak verildiğinde kullanılacak LogActionAsync overload'ı.
        public async Task LogActionAsync(int? userId, string action, string clientIpAddress)
        {
            var log = new Log
            {
                UserId = userId,
                Action = action,
                IpAddress = clientIpAddress,
                ActionDate = DateTime.Now
            };

            _context.Logs.Add(log);
            await _context.SaveChangesAsync();
        }

        // Kullanıcının IP adresini elde etmek için kullanılan metot.
        public string GetClientIpAddress(HttpContext httpContext)
        {
            // "X-Forwarded-For" başlığı kontrol edilir, bu genellikle proxy kullanıldığında faydalıdır.
            var forwardedHeader = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedHeader))
            {
                return forwardedHeader;  // IP adresi bulunursa döndürülür.
            }

            // Doğrudan bağlantıdan IP adresi alınır.
            var remoteIpAddress = httpContext.Connection.RemoteIpAddress;
            if (remoteIpAddress != null)
            {
                // IPv6 adresi ise ve IPv4 adresi varsa, IPv4 adresini kullan.
                if (remoteIpAddress.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
                {
                    remoteIpAddress = Dns.GetHostEntry(remoteIpAddress).AddressList
                        .FirstOrDefault(x => x.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
                }

                return remoteIpAddress?.ToString();
            }

            // IP adresi bulunamazsa null döndürülür.
            return null;
        }
    }
}
