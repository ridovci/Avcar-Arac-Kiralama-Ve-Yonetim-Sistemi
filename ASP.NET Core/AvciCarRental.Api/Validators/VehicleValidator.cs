using AvciCarRental.DataLayer.Entities;
using FluentValidation;

// Araç (Vehicle) nesnesi için doğrulama kurallarını tanımlayan sınıf.
namespace AvciCarRental.Api.Validators
{
    public class VehicleValidator : AbstractValidator<Vehicle>
    {
        public VehicleValidator()
        {
            // Günlük kiralama ücretinin boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.DailyRentalFee)
                .NotEmpty().WithMessage("Günlük kiralama ücreti boş olamaz.")
                .GreaterThan(0).WithMessage("Günlük kiralama ücreti sıfırdan büyük olmalıdır.");

            // Kişi sayısının boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.NumberOfPeople)
                .NotEmpty().WithMessage("Kişi sayısı boş olamaz.")
                .GreaterThan(0).WithMessage("Kişi sayısı sıfırdan büyük olmalıdır.");

            // Kapı sayısının boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.NumberOfDoors)
                .NotEmpty().WithMessage("Kapı sayısı boş olamaz.")
                .GreaterThan(0).WithMessage("Kapı sayısı sıfırdan büyük olmalıdır.");

            // Model ID'sinin boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.ModelId)
                .NotEmpty().WithMessage("Model ID boş olamaz.")
                .GreaterThan(0).WithMessage("Model ID sıfırdan büyük olmalıdır.");

            // Marka ID'sinin boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.BrandId)
                .NotEmpty().WithMessage("Marka ID boş olamaz.")
                .GreaterThan(0).WithMessage("Marka ID sıfırdan büyük olmalıdır.");

            // Model yılının boş olamayacağını ve 2005 ile mevcut yıl arasında olması gerektiğini doğrular.
            RuleFor(v => v.ModelYear)
                .NotEmpty().WithMessage("Model yılı boş olamaz.")
                .InclusiveBetween(2005, DateTime.Now.Year).WithMessage("Geçerli bir model yılı olmalıdır.");

            // Araç tipi ID'sinin boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.VehicleTypeId)
                .NotEmpty().WithMessage("Araç tipi ID boş olamaz.")
                .GreaterThan(0).WithMessage("Araç tipi ID sıfırdan büyük olmalıdır.");

            // Yakıt tipi ID'sinin boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.FuelTypeId)
                .NotEmpty().WithMessage("Yakıt tipi ID boş olamaz.")
                .GreaterThan(0).WithMessage("Yakıt tipi ID sıfırdan büyük olmalıdır.");

            // Vites tipi ID'sinin boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.GearTypeId)
                .NotEmpty().WithMessage("Vites tipi ID boş olamaz.")
                .GreaterThan(0).WithMessage("Vites tipi ID sıfırdan büyük olmalıdır.");

            // Renk ID'sinin boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.ColorId)
                .NotEmpty().WithMessage("Renk ID boş olamaz.")
                .GreaterThan(0).WithMessage("Renk ID sıfırdan büyük olmalıdır.");

            // Plakanın boş olamayacağını ve maksimum 10 karakter uzunluğunda olması gerektiğini doğrular.
            RuleFor(v => v.NumberPlate)
                .NotEmpty().WithMessage("Plaka boş olamaz.")
                .MaximumLength(10).WithMessage("Plaka en fazla 10 karakter uzunluğunda olmalıdır.");

            // Lokasyon ID'sinin boş olamayacağını ve sıfırdan büyük olması gerektiğini doğrular.
            RuleFor(v => v.LocationId)
                .NotEmpty().WithMessage("Lokasyon ID boş olamaz.")
                .GreaterThan(0).WithMessage("Lokasyon ID sıfırdan büyük olmalıdır.");
        }
    }
}
