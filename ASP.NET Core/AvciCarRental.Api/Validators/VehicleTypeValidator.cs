using AvciCarRental.DataLayer.Entities;
using FluentValidation;

// Araç türü (VehicleType) nesnesi için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class VehicleTypeValidator : AbstractValidator<VehicleType>
    {
        public VehicleTypeValidator()
        {
            // Araç türü adının boş olamayacağını ve maksimum 50 karakter uzunluğunda olması gerektiğini doğrular.
            RuleFor(vt => vt.VehicleTypeName)
                .NotEmpty().WithMessage("Araç türü adı gereklidir.")
                .MaximumLength(50).WithMessage("Araç türü adı 50 karakterden uzun olamaz.");
        }
    }
}
