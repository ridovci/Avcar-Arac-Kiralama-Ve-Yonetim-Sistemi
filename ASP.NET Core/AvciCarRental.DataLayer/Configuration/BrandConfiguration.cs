using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, Brand entity'si için veritabanı yapılandırmasını tanımlar.
    public class BrandConfiguration : IEntityTypeConfiguration<Brand>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<Brand> builder)
        {
            // Primary key olarak BrandId alanını belirler
            builder.HasKey(b => b.BrandId);

            // BrandName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(b => b.BrandName)
                .IsRequired()
                .HasMaxLength(50);

            // Model entity'si ile ilişki tanımlar
            builder.HasMany(b => b.Models)
                .WithOne(m => m.Brand)
                .HasForeignKey(m => m.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
