using AvciCarRental.DataLayer.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AvciCarRental.DataLayer.Configuration
{
    // Role entity'si için yapılandırma sınıfı
    public class RoleConfiguration : IEntityTypeConfiguration<Role>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<Role> builder)
        {
            // Primary key tanımlaması
            builder.HasKey(rc => rc.RoleId);

            // RoleName alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(rc => rc.RoleName)
                .IsRequired()
                .HasMaxLength(20);

            // RoleDescription alanının maksimum uzunluğunu belirler
            builder.Property(rc => rc.RoleDescription)
                .HasMaxLength(255);
        }
    }
}
