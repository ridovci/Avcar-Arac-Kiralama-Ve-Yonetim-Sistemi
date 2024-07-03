using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AvciCarRental.DataLayer.Configuration
{
    // Location entity'si için yapılandırma sınıfı
    public class LocationConfiguration : IEntityTypeConfiguration<Location>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<Location> builder)
        {
            // Primary key tanımlaması
            builder.HasKey(v => v.LocationId);

            // LocationName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(v => v.LocationName)
                .HasMaxLength(50)
                .IsRequired();
        }
    }
}
