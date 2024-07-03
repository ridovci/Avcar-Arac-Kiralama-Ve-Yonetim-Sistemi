namespace AvciCarRental.Api.DTOs
{
    public class UserDto
    {
        public int UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public int GenderCode { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Email { get; set; }
        public string MobilePhone { get; set; }
        public string DriverLicenseNumber { get; set; }
        public string DriverLicenseClass { get; set; }
    }

}
