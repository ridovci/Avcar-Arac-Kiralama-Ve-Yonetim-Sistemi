using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, Color entity'si için veritabanı yapılandırmasını tanımlar.
    public class ColorConfiguration : IEntityTypeConfiguration<Color>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<Color> builder)
        {
            // Primary key olarak ColorId alanını belirler
            builder.HasKey(c => c.ColorId);

            // ColorName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(c => c.ColorName)
                .HasMaxLength(20)
                .IsRequired();
        }
    }
}
