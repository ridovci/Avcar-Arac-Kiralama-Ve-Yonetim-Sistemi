using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AvciCarRental.DataLayer.Configuration
{
    // AdditionalRentalProduct entity'si için yapılandırma sınıfı
    public class AdditionalRentalProductConfiguration : IEntityTypeConfiguration<AdditionalRentalProduct>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<AdditionalRentalProduct> builder)
        {
            // Primary key tanımlaması
            builder.HasKey(arp => arp.AdditionalRentalProductId);

            // AdditionalRentalProductName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(arp => arp.AdditionalRentalProductName)
                .HasMaxLength(50)
                .IsRequired();

            // AdditionalRentalProductDescription alanının maksimum uzunluğunu belirler
            builder.Property(arp => arp.AdditionalRentalProductDescription)
                .HasMaxLength(255);

            // AdditionalRentalProductFee alanının gerekliliğini ve hassasiyetini (precision) belirler
            builder.Property(arp => arp.AdditionalRentalProductFee)
                .HasPrecision(18, 2)
                .IsRequired();
        }
    }
}
