using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, VehicleFeature entity'si için veritabanı yapılandırmasını tanımlar.
    public class VehicleFeatureConfiguration : IEntityTypeConfiguration<VehicleFeature>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<VehicleFeature> builder)
        {
            // Primary key olarak VehicleFeatureId alanını belirler
            builder.HasKey(vf => vf.VehicleFeatureId);

            // VehicleFeatureName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(vf => vf.VehicleFeatureName)
                .HasMaxLength(100)
                .IsRequired();
        }
    }
}
