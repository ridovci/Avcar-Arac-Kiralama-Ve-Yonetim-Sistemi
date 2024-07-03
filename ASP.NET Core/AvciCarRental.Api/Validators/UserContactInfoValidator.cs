using AvciCarRental.DataLayer.Entities;
using FluentValidation;

// Kullanıcı iletişim bilgileri (UserContactInfo) için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class UserContactInfoValidator : AbstractValidator<UserContactInfo>
    {
        public UserContactInfoValidator()
        {
            // Cep telefonu numarasının boş olamayacağını ve tam olarak 10 karakter uzunluğunda olması gerektiğini doğrular.
            RuleFor(uci => uci.MobilePhone)
                .NotEmpty().WithMessage("Cep telefonu numarası gereklidir.")
                .Length(10).WithMessage("Cep telefonu numarası 10 karakter uzunluğunda olmalıdır.");
        }
    }
}
