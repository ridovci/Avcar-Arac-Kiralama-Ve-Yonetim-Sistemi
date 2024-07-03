namespace AvciCarRental.Api.DTOs
{
    public class RentalDto
    {
        public int RentalId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string VehiclePlate { get; set; }
        public string VehicleModel { get; set; }
        public string BrandName { get; set; }
        public int ModelYear { get; set; }
        public string CustomerName { get; set; }
        public string Status { get; set; }
        public string DepartureLocationName { get; set; }
        public string ArrivalLocationName { get; set; }
        public decimal TotalPrice { get; set; }
        public DateTime RequestDate { get; set; }
        public string MobilePhone { get; set; }
    }
}
