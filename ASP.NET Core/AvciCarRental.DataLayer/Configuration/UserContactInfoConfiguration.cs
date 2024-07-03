using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, UserContactInfo entity'si için veritabanı yapılandırmasını tanımlar.
    public class UserContactInfoConfiguration : IEntityTypeConfiguration<UserContactInfo>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<UserContactInfo> builder)
        {
            // Primary key olarak UserContactInfoId alanını belirler
            builder.HasKey(ci => ci.UserContactInfoId);

            // MobilePhone alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(ci => ci.MobilePhone)
                .IsRequired() // Bu alanın zorunlu olduğunu belirtir
                .HasMaxLength(20); // Bu alanın maksimum uzunluğunu 20 karakter olarak belirler
        }
    }
}
