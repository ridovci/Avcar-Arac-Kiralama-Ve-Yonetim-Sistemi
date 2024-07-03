using AvciCarRental.DataLayer.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Bu namespace, API içindeki sınıfların ve metodların kapsamını tanımlar
namespace AvciCarRental.Api.Controllers
{
    // Sınıf seviyesinde tüm metodlar için rota tanımlar. Bu kontrolördeki tüm aksiyonlar 'api/vehicle-feature-assignments' altında yer alacak.
    [Route("api/vehicle-feature-assignments")]
    // Bu attribute, sınıfın bir API kontrolörü olduğunu belirtir ve MVC tarafından otomatik olarak model doğrulama gibi işlemlerin yapılmasını sağlar.
    [ApiController]
    public class VehicleFeatureAssignmentsController : ControllerBase
    {
        // Veritabanı bağlamını (_context) tutar. Bu field, sınıf içindeki diğer metodlar tarafından kullanılacak.
        private readonly AvciCarRentalDbContext _context;

        // Constructor. Dependency injection ile veritabanı bağlamı enjekte edilir.
        public VehicleFeatureAssignmentsController(AvciCarRentalDbContext context)
        {
            _context = context; // Enjekte edilen veritabanı bağlamını _context değişkenine ata.
        }

        // Belirli bir araca ait özellik atamalarını getirir. Araç ID'si, HTTP isteğinin URL'sinden alınır.
        [HttpGet("by-vehicle/{vehicleId}")]
        public async Task<ActionResult<List<VehicleFeatureAssignmentDto>>> GetVehicleFeatureAssignmentsByVehicleId(int vehicleId)
        {
            // Veritabanında belirtilen araç ID'sine sahip özellik atamalarını asenkron olarak bulur ve DTO (Data Transfer Object) olarak listeler.
            var result = await _context.VehicleFeatureAssignments
                                       .Where(vfa => vfa.VehicleId == vehicleId)
                                       .Select(vfa => new VehicleFeatureAssignmentDto
                                       {
                                           VehicleId = vfa.VehicleId,
                                           VehicleFeaturesId = vfa.VehicleFeaturesId
                                       })
                                       .ToListAsync();

            // result null ise veya boşsa NotFound (HTTP 404) döner.
            if (result == null || !result.Any())
            {
                return NotFound(); // Özellik atamaları bulunamazsa 404 hatası döner
            }

            return Ok(result); // Özellik atamaları bulunduysa 200 OK durum kodu ile birlikte sonucu döner
        }
    }
}
