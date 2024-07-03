using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AvciCarRental.DataLayer.Configuration
{
    // Rental entity'si için yapılandırma sınıfı
    public class RentalConfiguration : IEntityTypeConfiguration<Rental>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<Rental> builder)
        {
            // Primary key tanımlaması
            builder.HasKey(r => r.RentalId);

            // RentalDate, ReturnDate ve RequestDate alanlarının gerekliliğini belirler
            builder.Property(r => r.RentalDate).IsRequired();
            builder.Property(r => r.ReturnDate).IsRequired();
            builder.Property(r => r.RequestDate).IsRequired();

            // Status alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(r => r.Status)
                .IsRequired()
                .HasMaxLength(50);

            // ArrivalLocationId ve DepartureLocationId alanlarının gerekliliğini belirler
            builder.Property(r => r.ArrivalLocationId).IsRequired();
            builder.Property(r => r.DepartureLocationId).IsRequired();

            // Vehicle entity'si ile ilişki tanımlaması
            builder.HasOne(r => r.Vehicle)
                .WithMany()
                .HasForeignKey(r => r.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            // User entity'si ile ilişki tanımlaması
            builder.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // DepartureLocation entity'si ile ilişki tanımlaması
            builder.HasOne(r => r.DepartureLocation)
                .WithMany()
                .HasForeignKey(r => r.DepartureLocationId)
                .OnDelete(DeleteBehavior.Restrict);

            // ArrivalLocation entity'si ile ilişki tanımlaması
            builder.HasOne(r => r.ArrivalLocation)
                .WithMany()
                .HasForeignKey(r => r.ArrivalLocationId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
