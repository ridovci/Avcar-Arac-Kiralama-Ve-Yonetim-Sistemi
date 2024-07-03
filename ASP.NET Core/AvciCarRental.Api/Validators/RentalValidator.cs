using AvciCarRental.DataLayer.Entities;
using FluentValidation;

// Kiralama (Rental) nesnesi için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class RentalValidator : AbstractValidator<Rental>
    {
        public RentalValidator(bool isStatusUpdateOnly = false)
        {
            // Araç ID'sinin boş olmaması ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(r => r.VehicleId)
                .NotEmpty().WithMessage("Araç ID boş olamaz.")
                .GreaterThan(0).WithMessage("Araç ID sıfırdan büyük olmalıdır.");

            // Kullanıcı ID'sinin boş olmaması ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(r => r.UserId)
                .NotEmpty().WithMessage("Kullanıcı ID boş olamaz.")
                .GreaterThan(0).WithMessage("Kullanıcı ID sıfırdan büyük olmalıdır.");

            if (!isStatusUpdateOnly)
            {
                // Kiralama tarihinin bugünden önce olmaması gerektiğini doğrular.
                RuleFor(r => r.RentalDate)
                .NotEmpty().WithMessage("Kiralama tarihi boş olamaz.")
                .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Kiralama tarihi bugünden önce olamaz.");

                // Talep tarihinin bugünden önce olmaması gerektiğini doğrular.
                RuleFor(r => r.RequestDate)
                    .NotEmpty().WithMessage("Talep tarihi boş olamaz.")
                    .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Talep tarihi bugünden önce olamaz.");

            }

            // Dönüş tarihinin kiralama tarihinden en az 1 gün sonra olması gerektiğini doğrular.
            RuleFor(r => r.ReturnDate)
            .NotEmpty().WithMessage("Dönüş tarihi boş olamaz.")
            .Must((rental, returnDate) => (returnDate - rental.RentalDate).TotalDays >= 1).WithMessage("Dönüş tarihi kiralama tarihinden en az 1 gün sonra olmalıdır.");

            // Kiralama durumunun geçerli enum değerlerinden biri olması gerektiğini doğrular.
            RuleFor(r => r.Status)
                .IsInEnum().WithMessage("Geçersiz kiralama durumu.");

            // Yönetici onay tarihinin bugünden önce olmaması gerektiğini, belirli durumlar altında doğrular.
            RuleFor(r => r.AdminActionDate)
                .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Yönetici onay tarihi bugünden önce olamaz.")
                .When(r => r.Status == RentalStatus.Approved);

            // Yönetici ID'sinin sıfırdan büyük olması gerektiğini, onaylanmış veya tamamlanmış kiralamalar için doğrular.
            RuleFor(r => r.AdminUserId)
                .GreaterThan(0).WithMessage("Yönetici ID sıfırdan büyük olmalıdır.")
                .When(r => r.Status == RentalStatus.Completed || r.Status == RentalStatus.Approved)
                .WithMessage("Onaylanmış veya tamamlanmış kiralamalar için yönetici ID gerekli.");
        }
    }
}