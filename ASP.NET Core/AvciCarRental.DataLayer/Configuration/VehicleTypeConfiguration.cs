using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, VehicleType entity'si için veritabanı yapılandırmasını tanımlar.
    public class VehicleTypeConfiguration : IEntityTypeConfiguration<VehicleType>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<VehicleType> builder)
        {
            // Primary key olarak VehicleTypeId alanını belirler
            builder.HasKey(vt => vt.VehicleTypeId);

            // VehicleTypeName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(vt => vt.VehicleTypeName)
                .IsRequired()
                .HasMaxLength(50);
        }
    }
}
