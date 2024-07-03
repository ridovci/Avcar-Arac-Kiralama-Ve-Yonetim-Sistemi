using AvciCarRental.DataLayer.Entities;
using FluentValidation;

// Kullanıcı (User) nesnesi için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class UserValidator : AbstractValidator<User>
    {
        public UserValidator()
        {
            // TC kimlik numarasının boş olamayacağını ve tam olarak 11 karakter uzunluğunda olması gerektiğini doğrular.
            RuleFor(u => u.TCNumber)
                .NotEmpty().WithMessage("TC kimlik numarası gereklidir.")
                .Length(11).WithMessage("TC kimlik numarası 11 karakter uzunluğunda olmalıdır.");

            // Şifrenin boş olamayacağını ve maksimum 100 karakter uzunluğunda olması gerektiğini doğrular.
            RuleFor(u => u.PasswordHash)
                .NotEmpty().WithMessage("Şifre gereklidir.")
                .MaximumLength(100).WithMessage("Şifre 100 karakterden uzun olamaz.");

            // E-posta adresinin boş olamayacağını, maksimum 100 karakter uzunluğunda olması gerektiğini ve geçerli bir e-posta adresi olmasını doğrular.
            RuleFor(u => u.Email)
                .NotEmpty().WithMessage("E-posta adresi gereklidir.")
                .MaximumLength(100).WithMessage("E-posta adresi 100 karakterden uzun olamaz.")
                .EmailAddress().WithMessage("Geçerli bir e-posta adresi olmalıdır.");

            // Kullanıcının iletişim bilgileri için UserContactInfoValidator kullanarak doğrulama yapar.
            RuleFor(u => u.UserContactInfo).SetValidator(new UserContactInfoValidator());

            // Kullanıcının ehliyet bilgileri için UserLicenseInfoValidator kullanarak doğrulama yapar.
            RuleFor(u => u.UserLicenseInfo).SetValidator(new UserLicenseInfoValidator());

            // Kullanıcının kişisel bilgileri için UserPersonalInfoValidator kullanarak doğrulama yapar.
            RuleFor(u => u.UserPersonalInfo).SetValidator(new UserPersonalInfoValidator());
        }
    }
}
