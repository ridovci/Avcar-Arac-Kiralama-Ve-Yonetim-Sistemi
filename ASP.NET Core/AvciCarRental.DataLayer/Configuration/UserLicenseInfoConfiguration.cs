using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, UserLicenseInfo entity'si için veritabanı yapılandırmasını tanımlar.
    public class UserLicenseInfoConfiguration : IEntityTypeConfiguration<UserLicenseInfo>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<UserLicenseInfo> builder)
        {
            // Primary key olarak UserLicenseInfoId alanını belirler
            builder.HasKey(u => u.UserLicenseInfoId);

            // DriverLicenseIssueDate alanının gerekliliğini belirtir
            builder.Property(u => u.DriverLicenseIssueDate)
                .IsRequired(); // Bu alanın zorunlu olduğunu belirtir

            // DriverLicenseClass alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(u => u.DriverLicenseClass)
                .IsRequired() // Bu alanın zorunlu olduğunu belirtir
                .HasMaxLength(3); // Bu alanın maksimum uzunluğunu 3 karakter olarak belirler

        }
    }
}
