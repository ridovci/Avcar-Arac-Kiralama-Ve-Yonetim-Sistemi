using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
    {
        public void Configure(EntityTypeBuilder<Vehicle> builder)
        {
            // Primary key olarak VehicleId'yi belirler
            builder.HasKey(v => v.VehicleId);

            // NumberOfPeople property'yi zorunlu kılar
            builder.Property(v => v.NumberOfPeople).IsRequired();

            // ModelYear property'yi zorunlu kılar
            builder.Property(v => v.ModelYear).IsRequired();

            // NumberOfDoors property'yi zorunlu kılar
            builder.Property(v => v.NumberOfDoors).IsRequired();

            // Description property'yi zorunlu ve maksimum 40 karakter uzunluğunda kılar
            builder.Property(v => v.Description).HasMaxLength(40).IsRequired();

            // NumberPlate property'yi zorunlu ve maksimum 10 karakter uzunluğunda kılar
            builder.Property(v => v.NumberPlate).HasMaxLength(10).IsRequired();

            // MinDrivingLicenseYear property'yi zorunlu kılar ve varsayılan değer olarak 1 atar
            builder.Property(v => v.MinDrivingLicenseYear).IsRequired().HasDefaultValue(1);

            // MinDriverAge property'yi zorunlu kılar ve varsayılan değer olarak 18 atar
            builder.Property(v => v.MinDriverAge).IsRequired().HasDefaultValue(18);

            // DailyRentalFee property'yi zorunlu kılar ve 18,2 precision ile tanımlar
            builder.Property(v => v.DailyRentalFee).HasPrecision(18, 2).IsRequired();

            // DiscountRate property'yi 18,2 precision ile tanımlar, zorunlu değildir
            builder.Property(v => v.DiscountRate).HasPrecision(18, 2);

            // Status property'yi zorunlu kılar
            builder.Property(v => v.Status).IsRequired();

            // Foreign key olarak ModelId'yi belirler ve ilişkiyi restrict olarak tanımlar
            builder.HasOne(v => v.Model)
                   .WithMany()
                   .HasForeignKey(v => v.ModelId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Foreign key olarak BrandId'yi belirler ve ilişkiyi restrict olarak tanımlar
            builder.HasOne(v => v.Brand)
                   .WithMany()
                   .HasForeignKey(v => v.BrandId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Foreign key olarak LocationId'yi belirler ve ilişkiyi restrict olarak tanımlar
            builder.HasOne(v => v.Location)
                   .WithMany()
                   .HasForeignKey(v => v.LocationId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Foreign key olarak VehicleTypeId'yi belirler ve ilişkiyi restrict olarak tanımlar
            builder.HasOne(v => v.VehicleType)
                   .WithMany()
                   .HasForeignKey(v => v.VehicleTypeId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Foreign key olarak GearTypeId'yi belirler ve ilişkiyi restrict olarak tanımlar
            builder.HasOne(v => v.GearType)
                   .WithMany()
                   .HasForeignKey(v => v.GearTypeId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Foreign key olarak FuelTypeId'yi belirler ve ilişkiyi restrict olarak tanımlar
            builder.HasOne(v => v.FuelType)
                   .WithMany()
                   .HasForeignKey(v => v.FuelTypeId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Foreign key olarak AirConditioningId'yi belirler ve ilişkiyi restrict olarak tanımlar
            builder.HasOne(v => v.AirConditioning)
                   .WithMany()
                   .HasForeignKey(v => v.AirConditioningId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Rental ile ilişkiyi tanımlar ve foreign key olarak VehicleId'yi kullanır
            builder.HasMany(v => v.Rental)
                   .WithOne(r => r.Vehicle)
                   .HasForeignKey(r => r.VehicleId)
                   .OnDelete(DeleteBehavior.Restrict); // ilişkili bir entity'nin silinmesi durumunda ilişkili diğer entity'lerin silinmesini veya güncellenmesini engeller. 

            // VehicleImages ile ilişkiyi tanımlar ve foreign key olarak VehicleId'yi kullanır
            builder.HasMany(v => v.VehicleImages)
                 .WithOne(vi => vi.Vehicle)
                 .HasForeignKey(vi => vi.VehicleId)
                 .OnDelete(DeleteBehavior.Cascade); // Bu ilişkide araç silindiğinde ilgili resimler de silinir
        }
    }
}
