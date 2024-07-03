public class VehicleSearchCriteria
{
    public int? BrandId { get; set; }
    public int? ModelId { get; set; }
    public int? VehicleTypeId { get; set; }
    public int? GearTypeId { get; set; }
    public int? FuelTypeId { get; set; }
    public int? AirConditioningId { get; set; }
    public decimal? MinDailyRentalFee { get; set; }
    public decimal? MaxDailyRentalFee { get; set; }
    public List<int> FeatureIds { get; set; }
    public string Color { get; set; }
    public int? MinNumberOfPeople { get; set; }
    public int? MaxNumberOfPeople { get; set; }
    public int? MinNumberOfDoors { get; set; }
    public int? MaxNumberOfDoors { get; set; }
    public int? LocationId { get; set; }
    public DateTime? RentalDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public int? MinModelYear { get; set; }
    public int? MaxModelYear { get; set; } 
    public string SortOrder { get; set; } // JSON'dan doğrudan alınan değer

}
