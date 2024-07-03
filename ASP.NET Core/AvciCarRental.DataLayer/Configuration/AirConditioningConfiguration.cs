using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, AirConditioning entity'si için veritabanı yapılandırmasını tanımlar.
    public class AirConditioningConfiguration : IEntityTypeConfiguration<AirConditioning>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<AirConditioning> builder)
        {
            // Primary key olarak AirConditioningId alanını belirler
            builder.HasKey(ac => ac.AirConditioningId);

            // AirConditioningName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(ac => ac.AirConditioningName)
                .IsRequired()
                .HasMaxLength(50);
        }
    }
}
