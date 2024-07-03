using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AvciCarRental.Api.Validators;
using AvciCarRental.DataLayer.Context;
using System.Text;
using AvciCarRental.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controller hizmetlerini ekleyin
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
        options.JsonSerializerOptions.MaxDepth = 64; // Maksimum derinliği artırıyoruz
    })
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.PreserveReferencesHandling = Newtonsoft.Json.PreserveReferencesHandling.Objects;
    });


builder.Services.AddScoped<LoggingService>();

// Swagger/OpenAPI yapılandırmasını ekleyin (API belgeleri için)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Veritabanı bağlamını yapılandırın
builder.Services.AddDbContext<AvciCarRentalDbContext>(opt =>
{
    // Bağlantı dizesini yapılandırmadan alın
    var connStr = builder.Configuration.GetConnectionString("AvciCarRentalConnection");
    opt.UseSqlServer(connStr);
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 64; // Maksimum derinliği artırıyoruz
    })
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.PreserveReferencesHandling = Newtonsoft.Json.PreserveReferencesHandling.None;
    });

// FluentValidation hizmetlerini ekleyin
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<LoginModelValidator>();
// Aynı derlemede(Assembly) bulunan tüm validator sınıflarını otomatik olarak bulur ve kaydeder. 
// Bu sayede, her bir validator sınıfını tek tek belirtmek zorunda kalınmaz.
// "LoginModelValidator" sadece bir referans noktası olarak kullanılır ve aynı derlemede bulunan diğer tüm doğrulayıcılar da dahil edilir. 

// JWT doğrulama ve kimlik doğrulama hizmetlerini ekleyin
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        // JWT'nin verileceği adres
        var issuer = builder.Configuration["Jwt:Issuer"];
        // JWT imzalama anahtarı
        var key = builder.Configuration["Jwt:Key"];
        // İmzalama anahtarını oluşturun
        var issuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        // JWT doğrulama parametrelerini ayarlayın
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            // Geçerli issuer
            ValidIssuer = issuer,
            // İmzalama anahtarı
            IssuerSigningKey = issuerSigningKey,
            // Token yaşam süresi kontrolü
            ValidateLifetime = true,
            // Issuer kontrolü
            ValidateIssuer = true,
            // İmzalama anahtarı kontrolü
            ValidateIssuerSigningKey = true,
            // Audience kontrolü (burada devre dışı)
            ValidateAudience = false,
            // Rol için claim tipi
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            // İsim için claim tipi
            NameClaimType = System.Security.Claims.ClaimTypes.Name
        };

        // JWT olaylarını yapılandırın
        opt.Events = new JwtBearerEvents
        {
            // Kimlik doğrulama hatalarını ele alma
            OnChallenge = context =>
            {
                // İstemciye hatalı token gönderildiğinde Authorization başlığını döndür
                context.Response.Headers["Authorization"] = context.Request.Headers["Authorization"];
                return Task.CompletedTask;
            }
        };
    });


// CORS (Cross-Origin Resource Sharing) yapılandırmasını ekleyin
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()  // Tüm kaynaklardan gelen isteklere izin verin. örnek >> ("https://example.com")
              .AllowAnyMethod()  // Tüm HTTP metodlarına izin verin. örnek >> ("GET", "POST", "PUT", "DELETE")
              .AllowAnyHeader(); // Tüm başlıklara izin verin. örnek >> ("Authorization", "Content-Type", "Accept")

    });
});

var app = builder.Build();


// Geliştirme ortamında Swagger arayüzünü kullan
if (builder.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS yapılandırmasını kullanın
app.UseCors("AllowAll");

// Kimlik doğrulamayı ve yetkilendirmeyi etkinleştirin
app.UseAuthentication();
app.UseAuthorization();

// Controller haritalamaları
app.MapControllers();

// Uygulamayı çalıştırın
app.Run();
