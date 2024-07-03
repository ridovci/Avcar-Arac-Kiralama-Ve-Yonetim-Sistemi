using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, FuelType entity'si için veritabanı yapılandırmasını tanımlar.
    public class FuelTypeConfiguration : IEntityTypeConfiguration<FuelType>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<FuelType> builder)
        {
            // Primary key olarak FuelTypeId alanını belirler
            builder.HasKey(ft => ft.FuelTypeId);

            // FuelTypeName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(ft => ft.FuelTypeName)
                .IsRequired()
                .HasMaxLength(50);
        }
    }
}
