using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AvciCarRental.DataLayer.Configuration
{
    // Log entity'si için yapılandırma sınıfı
    public class LogConfiguration : IEntityTypeConfiguration<Log>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<Log> builder)
        {
            // Primary key tanımlaması
            builder.HasKey(l => l.LogId);

            // Action alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(l => l.Action)
                .IsRequired()
                .HasMaxLength(1000);

            // ActionDate alanının gerekliliğini belirler
            builder.Property(l => l.ActionDate)
                .IsRequired();

            // User entity'si ile ilişki tanımlaması
            builder.HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId);
        }
    }
}
