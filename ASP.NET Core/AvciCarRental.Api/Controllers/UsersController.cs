using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using AvciCarRental.Api.Models;
using AvciCarRental.DataLayer.Context;
using AvciCarRental.DataLayer.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using AvciCarRental.Api.Services;
using Microsoft.AspNetCore.Authorization;
using static AvciCarRental.Api.Controllers.VehiclesController;
using AvciCarRental.Api.DTOs;

namespace AvciCarRental.Api.Controllers
{
    // Route attribute: Bu controller'ın temel URL yolunu belirler.
    // ApiController attribute: Bu sınıfın bir API Controller olduğunu ve otomatik model doğrulaması gibi özellikler içerdiğini belirtir.
    [Route("api/users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        // Sınıf seviyesinde tanımlanan özel alanlar (fields).
        // Veritabanı bağlamını, validator'ları ve loglama servisini saklar.
        private readonly AvciCarRentalDbContext _context;
        private readonly IValidator<LoginModel> _loginModelValidator;
        private readonly IValidator<User> _userValidator;
        private readonly LoggingService _loggingService;
        private int? _userId; // Kullanıcı ID'sini saklar, null olabilir.

        // Constructor: Dependency Injection yoluyla bağımlılıkları alır.
        public UsersController(
            AvciCarRentalDbContext context,
            IValidator<LoginModel> loginModelValidator,
            IValidator<User> userValidator,
            LoggingService loggingService)
        {
            // Dependency Injection ile gelen nesneler sınıf alanlarına atanır.
            _context = context;  // Veritabanı bağlamı
            _loginModelValidator = loginModelValidator;  // Login modeli için validator
            _userValidator = userValidator;  // Kullanıcı modeli için validator
            _loggingService = loggingService;  // Loglama servisi
        }

        // Bir sayfalama sonucu modeli tanımlar.
        public class PagedResult<T>
        {
            public List<T> Items { get; set; } // Sonuçlar listesi
            public int TotalCount { get; set; } // Toplam sonuç sayısı
        }

        // JWT token'dan kullanıcı ID'sini çekip ayarlar.
        private void SetUserIdFromJwt()
        {
            // HTTP context üzerinden JWT'deki claim'leri kontrol eder ve "id" tipindeki claim'i bulur.
            var userIdClaim = HttpContext.User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
            // Eğer "id" claim'i varsa ve integer'a çevrilebiliyorsa _userId değerini günceller, değilse null bırakır.
            _userId = !string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId) ? userId : (int?)null;
        }

        // Yeni bir kullanıcı kaydı için POST endpoint'i.
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            SetUserIdFromJwt();  // JWT'den kullanıcı ID'sini ayarlar.

            // User modeli için validasyon yapar.
            ValidationResult validationResult = _userValidator.Validate(user);
            if (!validationResult.IsValid)  // Validasyon başarısızsa hataları döner.
            {
                return BadRequest(validationResult.Errors);
            }

            // Kullanıcının e-posta adresi daha önce kayıtlı mı diye kontrol eder.
            if (await _context.Users.AnyAsync(u => u.Email == user.Email))
            {
                await LogActionAsync("E-posta zaten kullanılıyor.");
                return BadRequest("E-posta zaten kullanılıyor.");
            }

            // Kullanıcının TC kimlik numarası daha önce kayıtlı mı diye kontrol eder.
            if (await _context.Users.AnyAsync(upi => upi.TCNumber == user.TCNumber))
            {
                await LogActionAsync("TC Kimlik Numarası zaten kullanılıyor.");
                return BadRequest("TC Kimlik Numarası zaten kullanılıyor.");
            }

            // Kullanıcının yaşı hesaplanır.
            var today = DateTime.Today;
            var userAge = today.Year - user.UserPersonalInfo.DateOfBirth.Year;
            if (user.UserPersonalInfo.DateOfBirth.Date > today.AddYears(-userAge)) userAge--;

            // Kullanıcının yaşı 18'den küçükse hata döner.
            if (userAge < 18)
            {
                await LogActionAsync("Kullanıcı yaşı 18'den büyük olmalıdır.");
                return BadRequest("Kullanıcı yaşı 18'den büyük olmalıdır.");
            }

            // Kullanıcının ehliyet veriliş tarihi kontrol edilir.
            if (user.UserLicenseInfo.DriverLicenseIssueDate > DateTime.Today)
            {
                await LogActionAsync("Ehliyet veriliş tarihi bugünden önce olmalıdır.");
                return BadRequest("Ehliyet veriliş tarihi bugünden önce olmalıdır.");
            }

            // Ehliyetin veriliş tarihinin kullanıcının 18 yaşına girdiği tarihten sonra olup olmadığı kontrol edilir.
            var minLicenseIssueDate = user.UserPersonalInfo.DateOfBirth.AddYears(18);
            if (user.UserLicenseInfo.DriverLicenseIssueDate < minLicenseIssueDate)
            {
                await LogActionAsync("Ehliyet veriliş tarihi, kullanıcının 18 yaşına girdiği tarihten sonra olmalıdır.");
                return BadRequest("Ehliyet veriliş tarihi, kullanıcının 18 yaşına girdiği tarihten sonra olmalıdır.");
            }

            // Kullanıcı ve ilişkili bilgiler veritabanına eklenir.
            user.Role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleId == user.RoleId);
            _context.Users.Add(user);
            if (user.UserContactInfo != null)
                _context.UserContactInfos.Add(user.UserContactInfo);
            if (user.UserPersonalInfo != null)
                _context.UserPersonalInfos.Add(user.UserPersonalInfo);
            if (user.UserLicenseInfo != null)
                _context.UserLicenseInfos.Add(user.UserLicenseInfo);

            // Veritabanındaki değişiklikler kaydedilir.
            await _context.SaveChangesAsync();

            // Başarıyla kayıt olduktan sonra loglama yapılır ve başarılı mesajı döner.
            await LogActionAsync("Kullanıcı başarılı bir şekilde kayıt oldu.");
            return Ok(new { message = "Kullanıcı başarılı bir şekilde kayıt oldu." });
        }

        // Kullanıcı girişi için POST endpoint'i.
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel loginModel)
        {
            SetUserIdFromJwt();  // JWT'den kullanıcı ID'sini çeker ve ayarlar.
            await LogActionAsync("Giriş denemesi.");  // Loglama işlemi yapar.

            // Giriş modeli için validasyon yapar.
            ValidationResult validationResult = _loginModelValidator.Validate(loginModel);
            if (!validationResult.IsValid)  // Eğer validasyon başarısızsa, hataları döner.
            {
                return BadRequest(validationResult.Errors);
            }

            // Veritabanında kullanıcının e-postası ile eşleşen kaydı arar.
            var user = _context.Users
                .Include(u => u.Role)
                .SingleOrDefault(u => u.Email == loginModel.Email);

            // Kullanıcı bulunamazsa veya şifre eşleşmezse hata döner.
            if (user == null || loginModel.Password != user.PasswordHash)
            {
                await LogActionAsync("Hatalı e-mail veya şifre.");
                return BadRequest("E-mail veya şifre hatalı");
            }

            // JWT token için claim'ler hazırlar.
            var claims = new List<Claim>
            {
                new Claim("id", user.UserId.ToString()),
                new Claim("mail", user.Email),
                new Claim("role", user.Role.RoleName)
            };

            // Token ayarları yapılır.
            var issuer = "http://avcar.com";  // Token issuer'ı
            var key = "komplex_salt_key$3info5€CuR1TY";  // Güvenlik anahtarı
            var credential = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
            var payload = new JwtPayload(issuer, issuer, claims, null, DateTime.Now.AddDays(7.0), DateTime.Now);

            // JWT token oluşturulur ve kullanıcıya döner.
            JwtSecurityToken token = new JwtSecurityToken(new JwtHeader(credential), payload);
            var jwtToken = new JwtSecurityTokenHandler().WriteToken(token);

            await LogActionAsync(user.UserId, "Kullanıcı başarılı bir şekilde giriş yaptı.");

            return Ok(new
            {
                token = jwtToken,
                type = "Bearer"
            });
        }

        // Kullanıcı listesini dönen endpoint.
        [HttpGet("user-list")]
        public async Task<ActionResult<PagedResult<UserDto>>> GetUserList(
            [FromQuery] string searchQuery = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string sort = "0")
        {
            // Kullanıcılar üzerinde sorgu yapmak için IQueryable arayüzünü kullanır.
            var query = _context.Users
                .Include(u => u.UserContactInfo)
                .Include(u => u.UserPersonalInfo)
                .Include(u => u.UserLicenseInfo)
                .AsQueryable();

            // Arama sorgusu varsa, isme göre filtreleme yapar.
            if (!string.IsNullOrEmpty(searchQuery))
            {
                query = query.Where(u => u.UserPersonalInfo.FirstName.Contains(searchQuery) ||
                                         u.UserPersonalInfo.LastName.Contains(searchQuery));
            }

            // Sıralama seçeneğine göre sorguyu düzenler.
            switch (sort)
            {
                case "0":
                    query = query.OrderByDescending(u => u.RegistrationDate);
                    break;
                case "1":
                    query = query.OrderBy(u => u.RegistrationDate);
                    break;
                case "2":
                    query = query.OrderBy(u => u.UserPersonalInfo.FirstName);
                    break;
                case "3":
                    query = query.OrderByDescending(u => u.UserPersonalInfo.FirstName);
                    break;
                case "4":
                    query = query.OrderBy(u => u.UserPersonalInfo.LastName);
                    break;
                case "5":
                    query = query.OrderByDescending(u => u.UserPersonalInfo.LastName);
                    break;
                default:
                    query = query.OrderByDescending(u => u.RegistrationDate);
                    break;
            }

            // Toplam sonuç sayısını hesaplar.
            var totalItems = await query.CountAsync();

            // Sayfalama uygulanarak sonuç listesi hazırlanır.
            var usersList = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Dto'ya çevirme işlemi gerçekleştirilir.
            var users = usersList.Select(u => new UserDto
            {
                UserId = u.UserId,
                FirstName = u.UserPersonalInfo.FirstName,
                LastName = u.UserPersonalInfo.LastName,
                GenderCode = u.UserPersonalInfo.GenderCode,
                DateOfBirth = u.UserPersonalInfo.DateOfBirth,
                Email = u.Email,
                MobilePhone = u.UserContactInfo.MobilePhone,
                DriverLicenseNumber = u.UserLicenseInfo.DriverLicenseNumber,
                DriverLicenseClass = u.UserLicenseInfo.DriverLicenseClass
            }).ToList();

            // Sayfalı sonuç olarak kullanıcılara döner.
            return Ok(new PagedResult<UserDto>
            {
                Items = users,
                TotalCount = totalItems
            });
        }

        // Kullanıcı sayısını döner.
        [HttpGet("counter")]
        public async Task<ActionResult<int>> GetUsersCount()
        {
            // Veritabanındaki toplam kullanıcı sayısını hesaplar ve döner.
            int usersCount = await _context.Users.CountAsync();
            return Ok(usersCount);
        }

        // Kullanıcı rollerini listeler.
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            // Veritabanından tüm rolleri asenkron olarak listeler ve döner.
            var roles = await _context.Roles.ToListAsync();
            return Ok(roles);
        }

        // Kullanıcıları belirli bir kritere göre arar.
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers(string query)
        {
            // Kullanıcı bilgilerini içeren ve arama sorgusuna göre filtrelenmiş bir sorgu oluşturur.
            var users = await _context.Users
                .Include(u => u.UserPersonalInfo)
                .Include(u => u.UserContactInfo)
                .Include(u => u.UserLicenseInfo)
                .Where(u => u.UserPersonalInfo.FirstName.Contains(query) ||
                            u.UserPersonalInfo.LastName.Contains(query) ||
                            u.UserContactInfo.MobilePhone.Contains(query) ||
                            u.Email.Contains(query))
                .ToListAsync();

            // Sonuçları döner.
            return Ok(users);
        }

        // Belirli bir TC kimlik numarasına sahip kullanıcıyı getirir.
        [HttpGet("tc/{tcNo}")]
        public async Task<IActionResult> TcNoId(string tcNo)
        {
            // Gelen TC kimlik numarasının formatını kontrol eder.
            if (tcNo.Length != 11 || !tcNo.All(char.IsDigit))
            {
                return BadRequest("TC Kimlik Numarası geçersiz.");
            }

            // TC kimlik numarasına göre kullanıcıyı bulur.
            var user = await _context.Users
                .Include(u => u.UserPersonalInfo)
                .Include(u => u.UserContactInfo)
                .Include(u => u.UserLicenseInfo)
                .FirstOrDefaultAsync(u => u.TCNumber == tcNo);

            // Kullanıcı bulunamazsa hata döner.
            if (user == null)
            {
                return BadRequest("Kullanıcı bulunamadı.");
            }

            // Kullanıcıyı döner.
            return Ok(user);
        }

        // Belirli bir kullanıcıyı siler.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            SetUserIdFromJwt(); // JWT'den kullanıcı ID'sini çeker ve ayarlar.

            // ID'ye göre kullanıcıyı bulur.
            var user = await _context.Users.FindAsync(id);
            if (user == null)  // Kullanıcı bulunamazsa hata döner.
            {
                await LogActionAsync("Kullanıcı bulunamadı.");
                return NotFound();
            }

            // Kullanıcıyı veritabanından kaldırır.
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();  // Değişiklikleri kaydeder.

            // Loglama yapar ve işlemi tamamlar.
            await LogActionAsync($"Admin tarafından {id} ID'ye sahip Kullanıcı başarıyla silindi.");
            return NoContent();  // Başarılı sonuç döner.
        }

        // Admin tarafından kullanıcı bilgilerini günceller.
        [Authorize(Roles = "Admin,Superadmin")]
        [HttpPut("admin-update/{userId}")]
        public async Task<IActionResult> UpdateUserByAdmin(int userId, [FromBody] User updatedUser)
        {
            SetUserIdFromJwt();  // JWT'den kullanıcı ID'sini çeker ve ayarlar.

            // Güncellenmek istenen kullanıcıyı bulur.
            var user = await _context.Users
                .Include(u => u.UserContactInfo)
                .Include(u => u.UserPersonalInfo)
                .Include(u => u.UserLicenseInfo)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)  // Kullanıcı bulunamazsa hata döner.
            {
                await LogActionAsync("Kullanıcı bulunamadı.");
                return NotFound("Kullanıcı bulunamadı.");
            }

            // Güncelleme için validasyon yapar.
            ValidationResult validationResult = _userValidator.Validate(updatedUser);
            if (!validationResult.IsValid)  // Validasyon başarısızsa hataları döner.
            {
                return BadRequest(validationResult.Errors);
            }

            // E-posta ve TC kimlik numarasının benzersiz olup olmadığını kontrol eder.
            if (await _context.Users.Where(u => u.UserId != userId).AnyAsync(u => u.Email == updatedUser.Email))
            {
                await LogActionAsync("E-posta zaten kullanılıyor.");
                return BadRequest("E-posta zaten kullanılıyor.");
            }
            if (await _context.Users.Where(upi => upi.UserId != userId).AnyAsync(upi => upi.TCNumber == updatedUser.TCNumber))
            {
                await LogActionAsync("TC Kimlik Numarası zaten kullanılıyor.");
                return BadRequest("TC Kimlik Numarası zaten kullanılıyor.");
            }

            // Kullanıcı bilgilerini günceller.
            user.Email = updatedUser.Email;
            user.TCNumber = updatedUser.TCNumber;
            user.RoleId = updatedUser.RoleId;

            // İletişim, kişisel ve ehliyet bilgileri varsa güncellenir.
            if (updatedUser.UserContactInfo != null)
            {
                user.UserContactInfo.MobilePhone = updatedUser.UserContactInfo.MobilePhone;
            }
            if (updatedUser.UserPersonalInfo != null)
            {
                user.UserPersonalInfo.FirstName = updatedUser.UserPersonalInfo.FirstName;
                user.UserPersonalInfo.LastName = updatedUser.UserPersonalInfo.LastName;
                user.UserPersonalInfo.GenderCode = updatedUser.UserPersonalInfo.GenderCode;
                user.UserPersonalInfo.DateOfBirth = updatedUser.UserPersonalInfo.DateOfBirth;
            }
            if (updatedUser.UserLicenseInfo != null)
            {
                user.UserLicenseInfo.DriverLicenseIssueDate = updatedUser.UserLicenseInfo.DriverLicenseIssueDate;
                user.UserLicenseInfo.DriverLicenseClass = updatedUser.UserLicenseInfo.DriverLicenseClass;
                user.UserLicenseInfo.DriverLicenseNumber = updatedUser.UserLicenseInfo.DriverLicenseNumber;
            }

            _context.Users.Update(user);  // Güncellenmiş kullanıcıyı veritabanında işaretler.
            await _context.SaveChangesAsync();  // Değişiklikleri kaydeder.

            // Başarılı güncelleme sonrası loglama yapar ve sonucu döner.
            await LogActionAsync($"Admin tarafından {userId} ID'ye sahip kullanıcı bilgileri başarılı bir şekilde güncellendi.");
            return Ok("Kullanıcı bilgileri başarılı bir şekilde güncellendi.");
        }

        // Kullanıcı kendi bilgilerini güncellemek için kullanılır.
        [HttpPut("self-update/{userId}")]
        public async Task<IActionResult> UpdateUserByUser(int userId, [FromBody] User updatedUser)
        {
            SetUserIdFromJwt();  // JWT'den kullanıcı ID'sini çeker ve ayarlar.

            // Güncellenmek istenen kullanıcıyı bulur.
            var user = await _context.Users
                .Include(u => u.UserContactInfo)
                .Include(u => u.UserPersonalInfo)
                .Include(u => u.UserLicenseInfo)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)  // Kullanıcı bulunamazsa hata döner.
            {
                await LogActionAsync("Kullanıcı bulunamadı.");
                return NotFound("Kullanıcı bulunamadı.");
            }

            // Güncelleme için validasyon yapar.
            ValidationResult validationResult = _userValidator.Validate(updatedUser);
            if (!validationResult.IsValid)  // Validasyon başarısızsa hataları döner.
            {
                return BadRequest(validationResult.Errors);
            }

            // E-posta ve TC kimlik numarasının benzersiz olup olmadığını kontrol eder.
            if (await _context.Users.Where(u => u.UserId != userId).AnyAsync(u => u.Email == updatedUser.Email))
            {
                await LogActionAsync("E-posta zaten kullanılıyor.");
                return BadRequest("E-posta zaten kullanılıyor.");
            }
            if (await _context.Users.Where(upi => upi.UserId != userId).AnyAsync(upi => upi.TCNumber == updatedUser.TCNumber))
            {
                await LogActionAsync("TC Kimlik Numarası zaten kullanılıyor.");
                return BadRequest("TC Kimlik Numarası zaten kullanılıyor.");
            }

            // Kullanıcı bilgilerini günceller.
            user.Email = updatedUser.Email;
            user.TCNumber = updatedUser.TCNumber;
            user.RoleId = user.RoleId;

            // İletişim, kişisel ve ehliyet bilgileri varsa güncellenir.
            if (updatedUser.UserContactInfo != null)
            {
                user.UserContactInfo.MobilePhone = updatedUser.UserContactInfo.MobilePhone;
            }
            if (updatedUser.UserPersonalInfo != null)
            {
                var today = DateTime.Today;
                var userAge = today.Year - updatedUser.UserPersonalInfo.DateOfBirth.Year;
                if (updatedUser.UserPersonalInfo.DateOfBirth.Date > today.AddYears(-userAge)) userAge--;

                if (userAge < 18)  // Kullanıcının yaşı 18'den küçükse hata döner.
                {
                    await LogActionAsync("Kullanıcı yaşı 18'den büyük olmalıdır.");
                    return BadRequest("Kullanıcı yaşı 18'den büyük olmalıdır.");
                }

                user.UserPersonalInfo.FirstName = updatedUser.UserPersonalInfo.FirstName;
                user.UserPersonalInfo.LastName = updatedUser.UserPersonalInfo.LastName;
                user.UserPersonalInfo.GenderCode = updatedUser.UserPersonalInfo.GenderCode;
                user.UserPersonalInfo.DateOfBirth = updatedUser.UserPersonalInfo.DateOfBirth;
            }
            if (updatedUser.UserLicenseInfo != null)
            {
                if (updatedUser.UserLicenseInfo.DriverLicenseIssueDate > DateTime.Today)  // Ehliyet veriliş tarihi bugünden önce olmalıdır.
                {
                    await LogActionAsync("Ehliyet veriliş tarihi bugünden önce olmalıdır.");
                    return BadRequest("Ehliyet veriliş tarihi bugünden önce olmalıdır.");
                }

                var minLicenseIssueDate = updatedUser.UserPersonalInfo.DateOfBirth.AddYears(18);
                if (updatedUser.UserLicenseInfo.DriverLicenseIssueDate < minLicenseIssueDate)  // Ehliyetin veriliş tarihi 18 yaşından önce ise hata döner.
                {
                    await LogActionAsync("Ehliyet veriliş tarihi, kullanıcının 18 yaşına girdiği tarihten sonra olmalıdır.");
                    return BadRequest("Ehliyet veriliş tarihi, kullanıcının 18 yaşına girdiği tarihten sonra olmalıdır.");
                }

                user.UserLicenseInfo.DriverLicenseIssueDate = updatedUser.UserLicenseInfo.DriverLicenseIssueDate;
                user.UserLicenseInfo.DriverLicenseClass = updatedUser.UserLicenseInfo.DriverLicenseClass;
                user.UserLicenseInfo.DriverLicenseNumber = updatedUser.UserLicenseInfo.DriverLicenseNumber;
            }

            _context.Users.Update(user);  // Güncellenmiş kullanıcıyı veritabanında işaretler.
            await _context.SaveChangesAsync();  // Değişiklikleri kaydeder.

            // Başarılı güncelleme sonrası loglama yapar ve sonucu döner.
            await LogActionAsync("Kullanıcı bilgilerini başarılı bir şekilde güncelledi.");
            return Ok("Kullanıcı bilgileri başarılı bir şekilde güncellendi.");
        }

        // Belirli bir ID'ye sahip kullanıcıyı getirir.
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            // Veritabanından belirli bir ID'ye sahip kullanıcıyı dahil edilen tüm bilgilerle birlikte çeker.
            var user = await _context.Users
                                     .Include(u => u.Role)
                                     .Include(u => u.UserContactInfo)
                                     .Include(u => u.UserPersonalInfo)
                                     .Include(u => u.UserLicenseInfo)
                                     .Where(u => u.UserId == id)
                                     .SingleOrDefaultAsync();

            if (user == null)  // Kullanıcı bulunamazsa hata döner.
            {
                return NotFound();
            }

            return Ok(user);  // Kullanıcıyı döner.
        }

        // Loglama işlemini gerçekleştiren asenkron metod.
        private async Task LogActionAsync(string action)
        {
            SetUserIdFromJwt();

            // Geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            await _loggingService.LogActionAsync(_userId, action, HttpContext);
        }

        // Loglama işlemini gerçekleştiren asenkron metod.(Kullanıcı giriş sürecinde Ip ve Kullanıcı Id null sorunu dolayısıyla kullanılıyor.)
        private async Task LogActionAsync(int userId, string action)
        {
            // Geçerli kullanıcı ID'si ve aksiyon detayı ile loglama yapar.
            var IpAddress = _loggingService.GetClientIpAddress(HttpContext);
            await _loggingService.LogActionAsync(userId, action, IpAddress);
        }
    }
}


