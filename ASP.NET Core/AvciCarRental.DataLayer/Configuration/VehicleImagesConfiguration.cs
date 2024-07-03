using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

public class VehicleImagesConfiguration : IEntityTypeConfiguration<VehicleImage>
{
    // Entity yapılandırmasını tanımlayan metod
    public void Configure(EntityTypeBuilder<VehicleImage> builder)
    {
        // Primary key olarak VehicleImageId alanını belirler
        builder.HasKey(vi => vi.VehicleImageId);

        // VehicleImageUrl alanının gerekliliğini ve veritabanı türünü belirler
        builder.Property(vi => vi.VehicleImageUrl)
            .IsRequired()
            .HasColumnType("varchar(max)");

        // Vehicle entity'si ile ilişki tanımlar
        builder.HasOne(vi => vi.Vehicle)
            .WithMany(v => v.VehicleImages)
            .HasForeignKey(vi => vi.VehicleId);
    }
}
