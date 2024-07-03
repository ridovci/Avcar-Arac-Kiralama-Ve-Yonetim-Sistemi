using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, VehicleFeatureAssignment entity'si için veritabanı yapılandırmasını tanımlar.
    public class VehicleFeatureAssignmentConfiguration : IEntityTypeConfiguration<VehicleFeatureAssignment>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<VehicleFeatureAssignment> builder)
        {
            // Birleşik anahtar (composite key) tanımlar: VehicleId ve VehicleFeaturesId
            builder.HasKey(vfa => new { vfa.VehicleId, vfa.VehicleFeaturesId });

            // Vehicle entity'si ile ilişki tanımlar
            builder.HasOne(vfa => vfa.Vehicle)
                .WithMany(v => v.VehicleFeatureAssignments)
                .HasForeignKey(vfa => vfa.VehicleId);

            // VehicleFeatures entity'si ile ilişki tanımlar
            builder.HasOne(vfa => vfa.VehicleFeatures)
                .WithMany(vf => vf.VehicleFeatureAssignments)
                .HasForeignKey(vfa => vfa.VehicleFeaturesId);
        }
    }
}
