using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AvciCarRental.DataLayer.Configuration
{
    // Payment entity'si için yapılandırma sınıfı
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            // Primary key tanımlaması
            builder.HasKey(p => p.PaymentId);

            // PaymentDate alanının gerekliliğini belirler
            builder.Property(p => p.PaymentDate).IsRequired();

            // PaymentAmount alanının gerekliliğini ve veritabanı türünü belirler
            builder.Property(p => p.PaymentAmount)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            // PaymentStatus alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(p => p.PaymentStatus)
                .IsRequired()
                .HasMaxLength(50);

            // TransactionId alanının gerekliliğini belirler
            builder.Property(p => p.TransactionId).IsRequired();

            // PaymentMethod alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(p => p.PaymentMethod)
                .IsRequired()
                .HasMaxLength(50);

            // Enum değerlerini string olarak veritabanında saklamak için conversion
            builder.Property(p => p.PaymentStatus)
                .HasConversion<string>();

            builder.Property(p => p.PaymentMethod)
                .HasConversion<string>();
        }
    }
}
