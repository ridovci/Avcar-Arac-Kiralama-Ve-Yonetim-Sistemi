using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, UserPersonalInfo entity'si için veritabanı yapılandırmasını tanımlar.
    public class UserPersonalInfoConfiguration : IEntityTypeConfiguration<UserPersonalInfo>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<UserPersonalInfo> builder)
        {
            // Primary key olarak UserPersonalInfoId alanını belirler
            builder.HasKey(pi => pi.UserPersonalInfoId);

            // FirstName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(u => u.FirstName)
                .IsRequired() // Bu alanın zorunlu olduğunu belirtir
                .HasMaxLength(50); // Bu alanın maksimum uzunluğunu 50 karakter olarak belirler

            // LastName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(u => u.LastName)
                .IsRequired() // Bu alanın zorunlu olduğunu belirtir
                .HasMaxLength(50); // Bu alanın maksimum uzunluğunu 50 karakter olarak belirler

            // GenderCode alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(u => u.GenderCode)
                .IsRequired() // Bu alanın zorunlu olduğunu belirtir
                .HasMaxLength(1); // Bu alanın maksimum uzunluğunu 1 karakter olarak belirler

            // DateOfBirth alanının gerekliliğini belirtir
            builder.Property(u => u.DateOfBirth)
                .IsRequired(); // Bu alanın zorunlu olduğunu belirtir
        }
    }
}
