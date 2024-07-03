using FluentValidation;
using AvciCarRental.Api.Models;

// LoginModel için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class LoginModelValidator : AbstractValidator<LoginModel>
    {
        public LoginModelValidator()
        {
            // E-posta adresinin boş olmaması ve maksimum 50 karakter uzunluğunda olması gerektiğini belirtir.
            RuleFor(lm => lm.Email)
                .NotEmpty().WithMessage("E-mail gereklidir.")
                .MaximumLength(50).WithMessage("E-mail 50 karakterden uzun olamaz.");

            // Şifrenin boş olmaması, minimum 6 ve maksimum 100 karakter uzunluğunda olması gerektiğini belirtir.
            RuleFor(lm => lm.Password)
                .NotEmpty().WithMessage("Şifre gereklidir.")
                .MinimumLength(6).WithMessage("Şifre en az 6 karakter uzunluğunda olmalıdır.")
                .MaximumLength(100).WithMessage("Şifre 100 karakterden uzun olamaz.");
        }
    }
}