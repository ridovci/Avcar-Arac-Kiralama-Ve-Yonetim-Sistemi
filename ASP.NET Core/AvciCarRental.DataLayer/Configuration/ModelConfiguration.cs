using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, Model entity'si için veritabanı yapılandırmasını tanımlar.
    public class ModelConfiguration : IEntityTypeConfiguration<Model>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<Model> builder)
        {
            // Primary key olarak ModelId alanını belirler
            builder.HasKey(m => m.ModelId);

            // ModelName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(m => m.ModelName)
                .IsRequired()
                .HasMaxLength(50);

            // Brand entity'si ile ilişki tanımlar
            builder.HasOne(m => m.Brand)
                .WithMany(b => b.Models)
                .HasForeignKey(m => m.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
