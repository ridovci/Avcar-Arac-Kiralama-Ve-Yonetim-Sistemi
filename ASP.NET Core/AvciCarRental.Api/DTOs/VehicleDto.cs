public class VehicleDto
{
    public int VehicleId { get; set; } 
    public int ModelId { get; set; }
    public string ModelName { get; set; } 
    public int BrandId { get; set; }
    public string BrandName { get; set; }
    public int ModelYear { get; set; }
    public int VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } 
    public int FuelTypeId { get; set; }
    public string FuelTypeName { get; set; } 
    public int GearTypeId { get; set; }
    public string GearTypeName { get; set; } 
    public int AirConditioningId { get; set; }
    public bool HasAirConditioning { get; set; } 
    public int NumberOfPeople { get; set; }
    public int NumberOfDoors { get; set; }
    public int ColorId { get; set; }
    public string ColorName { get; set; } 
    public string NumberPlate { get; set; }
    public int LocationId { get; set; }
    public string LocationName { get; set; } 
    public decimal DailyRentalFee { get; set; }
    public decimal DiscountRate { get; set; }
    public int MinDriverAge { get; set; }
    public int MinDrivingLicenseYear { get; set; }
    public int Status { get; set; }
    public string Description { get; set; }
    public List<VehicleImageDto> VehicleImages { get; set; }
    public List<string> VehicleFeatures { get; set; } // Feature isimlerini saklamak için list eklenir
    public List<VehicleFeatureAssignmentDto> VehicleFeatureAssignments { get; set; } // Feature Assignmentları saklamak için list eklenir

}

public class VehicleImageDto
{
    public int VehicleImageId { get; set; }
    public string VehicleImageUrl { get; set; }
}

public class VehicleFeatureAssignmentDto
{
    public int VehicleId { get; set; }
    public int VehicleFeaturesId { get; set; }
    public string VehicleFeatureName { get; set; }
}
