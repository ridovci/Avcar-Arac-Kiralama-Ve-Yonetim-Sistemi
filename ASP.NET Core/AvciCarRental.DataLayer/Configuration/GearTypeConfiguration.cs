using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, GearType entity'si için veritabanı yapılandırmasını tanımlar.
    public class GearTypeConfiguration : IEntityTypeConfiguration<GearType>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<GearType> builder)
        {
            // Primary key olarak GearTypeId alanını belirler
            builder.HasKey(gt => gt.GearTypeId);

            // GearTypeName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(gt => gt.GearTypeName)
                .IsRequired()
                .HasMaxLength(50);
        }
    }
}
