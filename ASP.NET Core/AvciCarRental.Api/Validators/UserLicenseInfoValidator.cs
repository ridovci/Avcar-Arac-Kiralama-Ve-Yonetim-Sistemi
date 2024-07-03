using AvciCarRental.DataLayer.Entities;
using FluentValidation;

// Kullanıcı ehliyet bilgileri (UserLicenseInfo) için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class UserLicenseInfoValidator : AbstractValidator<UserLicenseInfo>
    {
        public UserLicenseInfoValidator()
        {
            // Ehliyet veriliş tarihinin ve ehliyet sınıfının boş olamayacağını ve ehliyet numarasının maksimum 20 karakter uzunluğunda olması gerektiğini doğrular.
            RuleFor(uli => uli.DriverLicenseIssueDate)
                .NotEmpty().WithMessage("Ehliyet veriliş tarihi gereklidir.");

            RuleFor(uli => uli.DriverLicenseClass)
                .NotEmpty().WithMessage("Ehliyet sınıfı gereklidir.")
                .MaximumLength(10).WithMessage("Ehliyet sınıfı 10 karakterden uzun olamaz.");

            RuleFor(uli => uli.DriverLicenseNumber)
                .NotEmpty().WithMessage("Ehliyet numarası gereklidir.")
                .MaximumLength(20).WithMessage("Ehliyet numarası 20 karakterden uzun olamaz.");
        }
    }
}
