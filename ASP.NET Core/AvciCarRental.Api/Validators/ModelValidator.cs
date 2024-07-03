using AvciCarRental.DataLayer.Entities;
using FluentValidation;

// Model nesnesi için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class ModelValidator : AbstractValidator<Model>
    {
        public ModelValidator()
        {
            // Marka ID'sinin boş olmamasını doğrular.
            RuleFor(m => m.BrandId).NotEmpty().WithMessage("Marka Id gereklidir.");
            // Model adının boş olmamasını ve maksimum 50 karakter uzunluğunda olmasını doğrular.
            RuleFor(m => m.ModelName).NotEmpty().MaximumLength(50).WithMessage("Model adı 50 karakterden uzun olamaz.");
        }
    }
}