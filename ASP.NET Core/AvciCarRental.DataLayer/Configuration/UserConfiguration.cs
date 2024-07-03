using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Configuration
{
    // Bu sınıf, User entity'si için veritabanı yapılandırmasını tanımlar.
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        // Entity yapılandırmasını tanımlayan metod
        public void Configure(EntityTypeBuilder<User> builder)
        {
            // Primary key olarak UserId alanını belirler
            builder.HasKey(u => u.UserId);

            // TCNumber alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(u => u.TCNumber)
                .IsRequired() // Bu alanın zorunlu olduğunu belirtir
                .HasMaxLength(11); // Bu alanın maksimum uzunluğunu 11 karakter olarak belirler

            // PasswordHash alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(u => u.PasswordHash)
                .IsRequired() // Bu alanın zorunlu olduğunu belirtir
                .HasMaxLength(255); // Bu alanın maksimum uzunluğunu 255 karakter olarak belirler

            // Email alanının gerekliliğini ve maksimum uzunluğunu belirler
            builder.Property(u => u.Email)
                .IsRequired() // Bu alanın zorunlu olduğunu belirtir
                .HasMaxLength(100); // Bu alanın maksimum uzunluğunu 100 karakter olarak belirler

            // Role entity'si ile olan ilişkiyi tanımlar
            builder.HasOne(u => u.Role)
                .WithMany() // Role entity'sinin çok sayıda User entity'si olabileceğini belirtir
                .HasForeignKey(u => u.RoleId) // Yabancı anahtarın RoleId olduğunu belirtir
                .OnDelete(DeleteBehavior.Restrict); // Role entity'si silindiğinde bu ilişkili User entity'sinin silinmesini veya güncellenmesini engeller

            // UserContactInfo entity'si ile olan ilişkiyi tanımlar
            builder.HasOne(u => u.UserContactInfo)
                .WithMany() // UserContactInfo entity'sinin çok sayıda User entity'si olabileceğini belirtir
                .HasForeignKey(u => u.UserContactInfoId) // Yabancı anahtarın UserContactInfoId olduğunu belirtir
                .OnDelete(DeleteBehavior.Restrict); // UserContactInfo entity'si silindiğinde bu ilişkili User entity'sinin silinmesini veya güncellenmesini engeller

            // UserPersonalInfo entity'si ile olan ilişkiyi tanımlar
            builder.HasOne(u => u.UserPersonalInfo)
                .WithMany() // UserPersonalInfo entity'sinin çok sayıda User entity'si olabileceğini belirtir
                .HasForeignKey(u => u.PersonalInfoId) // Yabancı anahtarın PersonalInfoId olduğunu belirtir
                .OnDelete(DeleteBehavior.Restrict); // UserPersonalInfo entity'si silindiğinde bu ilişkili User entity'sinin silinmesini veya güncellenmesini engeller

            // UserLicenseInfo entity'si ile olan ilişkiyi tanımlar
            builder.HasOne(u => u.UserLicenseInfo)
                .WithMany() // UserLicenseInfo entity'sinin çok sayıda User entity'si olabileceğini belirtir
                .HasForeignKey(u => u.LicenseInfoId) // Yabancı anahtarın LicenseInfoId olduğunu belirtir
                .OnDelete(DeleteBehavior.Restrict); // UserLicenseInfo entity'si silindiğinde bu ilişkili User entity'sinin silinmesini veya güncellenmesini engeller

            // Rental entity'si ile olan ilişkiyi tanımlar
            builder.HasMany(u => u.Rental)
                .WithOne(r => r.User) // Rental entity'sinin her birinin bir User entity'si olabileceğini belirtir
                .HasForeignKey(r => r.UserId) // Yabancı anahtarın UserId olduğunu belirtir
                .OnDelete(DeleteBehavior.Restrict); // User entity'si silindiğinde bu ilişkili Rental entity'sinin silinmesini veya güncellenmesini engeller
        }
    }
}
