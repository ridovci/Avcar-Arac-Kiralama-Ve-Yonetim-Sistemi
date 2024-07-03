using Microsoft.EntityFrameworkCore;
using AvciCarRental.DataLayer.Configuration;
using AvciCarRental.DataLayer.Entities;

namespace AvciCarRental.DataLayer.Context
{
    // DbContext sınıfı, Entity Framework Core'un veri tabanı ile etkileşim kurmasını sağlar
    public class AvciCarRentalDbContext : DbContext
    {
        // DbContextOptions parametresi ile yapılandırma seçeneklerini alır
        public AvciCarRentalDbContext(DbContextOptions<AvciCarRentalDbContext> options) : base(options)
        {
        }

        // Veri tabanı tablolarını temsil eden DbSet özellikleri
        public DbSet<AirConditioning> AirConditionings { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<FuelType> FuelTypes { get; set; }
        public DbSet<GearType> GearTypes { get; set; }
        public DbSet<Log> Logs { get; set; }
        public DbSet<Model> Models { get; set; }
        public DbSet<Rental> Rentals { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserContactInfo> UserContactInfos { get; set; }
        public DbSet<UserLicenseInfo> UserLicenseInfos { get; set; }
        public DbSet<UserPersonalInfo> UserPersonalInfos { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<VehicleType> VehicleTypes { get; set; }
        public DbSet<VehicleFeature> VehicleFeatures { get; set; }
        public DbSet<VehicleFeatureAssignment> VehicleFeatureAssignments { get; set; }
        public DbSet<VehicleImage> VehicleImages { get; set; }
        public DbSet<Location> Locations { get; set; }
        public DbSet<AdditionalRentalProduct> AdditionalRentalProducts { get; set; }
        public DbSet<AdditionalRentalProductAssignment> AdditionalRentalProductAssignments { get; set; }
        public DbSet<Color> Colors { get; set; }
        public DbSet<Payment> Payments { get; set; }

        // Model oluşturma aşamasında yapılandırma tanımları
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfiguration(new AirConditioningConfiguration());
            modelBuilder.ApplyConfiguration(new BrandConfiguration());
            modelBuilder.ApplyConfiguration(new FuelTypeConfiguration());
            modelBuilder.ApplyConfiguration(new GearTypeConfiguration());
            modelBuilder.ApplyConfiguration(new LogConfiguration());
            modelBuilder.ApplyConfiguration(new ModelConfiguration());
            modelBuilder.ApplyConfiguration(new RentalConfiguration());
            modelBuilder.ApplyConfiguration(new RoleConfiguration());
            modelBuilder.ApplyConfiguration(new UserConfiguration());
            modelBuilder.ApplyConfiguration(new UserContactInfoConfiguration());
            modelBuilder.ApplyConfiguration(new UserLicenseInfoConfiguration());
            modelBuilder.ApplyConfiguration(new UserPersonalInfoConfiguration());
            modelBuilder.ApplyConfiguration(new VehicleConfiguration());
            modelBuilder.ApplyConfiguration(new VehicleTypeConfiguration());
            modelBuilder.ApplyConfiguration(new VehicleFeatureAssignmentConfiguration());
            modelBuilder.ApplyConfiguration(new VehicleFeatureConfiguration());
            modelBuilder.ApplyConfiguration(new VehicleImagesConfiguration());
            modelBuilder.ApplyConfiguration(new LocationConfiguration());
            modelBuilder.ApplyConfiguration(new AdditionalRentalProductAssignmentConfiguration());
            modelBuilder.ApplyConfiguration(new AdditionalRentalProductConfiguration());
            modelBuilder.ApplyConfiguration(new ColorConfiguration());
            modelBuilder.ApplyConfiguration(new PaymentConfiguration());

        }
    }
}
