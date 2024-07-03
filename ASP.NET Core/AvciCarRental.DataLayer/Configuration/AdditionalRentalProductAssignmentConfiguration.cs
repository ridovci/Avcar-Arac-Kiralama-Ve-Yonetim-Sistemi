using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AvciCarRental.DataLayer.Configuration
{
    // AdditionalRentalProductAssignment entity'si için yapılandırma sınıfı
    public class AdditionalRentalProductAssignmentConfiguration : IEntityTypeConfiguration<AdditionalRentalProductAssignment>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<AdditionalRentalProductAssignment> builder)
        {
            // Composite key tanımlaması (birleşik anahtar)
            builder.HasKey(ar => new { ar.RentalId, ar.AdditionalRentalProductId });

            // Rental entity'si ile ilişki tanımlaması
            builder.HasOne(ar => ar.Rental)
                .WithMany(ar => ar.AdditionalRentalProductAssignments)
                .HasForeignKey(ar => ar.RentalId);

            // AdditionalRentalProduct entity'si ile ilişki tanımlaması
            builder.HasOne(ar => ar.AdditionalRentalProduct)
                .WithMany(ar => ar.AdditionalRentalProductAssignments)
                .HasForeignKey(ar => ar.AdditionalRentalProductId);
        }
    }
}
