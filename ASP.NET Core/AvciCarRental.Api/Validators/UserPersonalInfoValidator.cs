using AvciCarRental.DataLayer.Entities;
using FluentValidation;

// Kullanıcı kişisel bilgileri (UserPersonalInfo) için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class UserPersonalInfoValidator : AbstractValidator<UserPersonalInfo>
    {
        public UserPersonalInfoValidator()
        {
            // Kullanıcının adının boş olamayacağını ve maksimum 50 karakter uzunluğunda olması gerektiğini doğrular.
            RuleFor(upi => upi.FirstName)
                .NotEmpty().WithMessage("Ad gereklidir.")
                .MaximumLength(50).WithMessage("Ad 50 karakterden uzun olamaz.");

            // Kullanıcının soyadının boş olamayacağını ve maksimum 50 karakter uzunluğunda olması gerektiğini doğrular.
            RuleFor(upi => upi.LastName)
                .NotEmpty().WithMessage("Soyad gereklidir.")
                .MaximumLength(50).WithMessage("Soyad 50 karakterden uzun olamaz.");

            // Kullanıcının cinsiyet kodunun ve doğum tarihinin boş olamayacağını doğrular.
            RuleFor(upi => upi.GenderCode)
                .NotEmpty().WithMessage("Cinsiyet kodu gereklidir.");

            RuleFor(upi => upi.DateOfBirth)
                .NotEmpty().WithMessage("Doğum tarihi gereklidir.");
        }
    }
}
