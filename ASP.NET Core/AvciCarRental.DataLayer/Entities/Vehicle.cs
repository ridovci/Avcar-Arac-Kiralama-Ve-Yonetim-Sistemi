using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations.Schema;
using System.Drawing;
using System.Text.Json.Serialization;

namespace AvciCarRental.DataLayer.Entities
{
    public class Vehicle
    {
        public int VehicleId { get; set; }
        public decimal DailyRentalFee { get; set; }
        public int NumberOfPeople { get; set; }
        public int NumberOfDoors { get; set; }
        public int ModelYear { get; set; }
        public string NumberPlate{ get; set; }
        public int MinDriverAge { get; set; }
        public int MinDrivingLicenseYear { get; set; }
        public decimal? DiscountRate { get; set; }
        public int Status { get; set; }
        public  string Description { get; set; }
           public int ModelId { get; set; }
        [ForeignKey("ModelId")]
        public Model Model { get; set; }

        public int BrandId { get; set; }
        [ForeignKey("BrandId")]
        public Brand Brand { get; set; }

        public int LocationId { get; set; }
        [ForeignKey("LocationId")]
        public Location Location { get; set; }

        public int VehicleTypeId { get; set; }
        [ForeignKey("VehicleTypeId")]
        public VehicleType VehicleType { get; set; }
        public int ColorId { get; set; }
        [ForeignKey("ColorId")]
        public Color Color { get; set; }

        public int GearTypeId { get; set; }
        [ForeignKey("GearTypeId")]
        public GearType GearType { get; set; }

        public int FuelTypeId { get; set; }
        [ForeignKey("FuelTypeId")]
        public FuelType FuelType { get; set; }

        public int AirConditioningId { get; set; }
        [ForeignKey("AirConditioningId")]
        public AirConditioning AirConditioning { get; set; }
        [JsonIgnore]
        public ICollection<Rental> Rental { get; set; }


        // Çoktan çoğa ilişki için navigasyon özelliği
        [JsonIgnore]
        public ICollection<VehicleImage> VehicleImages { get; set; }
        [JsonIgnore]
        public ICollection<VehicleFeatureAssignment> VehicleFeatureAssignments { get; set; }
    }
}
