using System.ComponentModel.DataAnnotations.Schema;

namespace AvciCarRental.DataLayer.Entities
{
    public class User
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string TCNumber { get; set; }
        public DateTime RegistrationDate { get; set; }

        public int RoleId { get; set; }
        [ForeignKey("RoleId")]
        public Role? Role { get; set; }


        public int UserContactInfoId { get; set; }
        [ForeignKey("UserContactInfoId")]
        public UserContactInfo? UserContactInfo { get; set; }


        public int PersonalInfoId { get; set; }
        [ForeignKey("PersonalInfoId")]
        public UserPersonalInfo? UserPersonalInfo { get; set; }


        public int LicenseInfoId { get; set; }
        [ForeignKey("LicenseInfoId")]
        public UserLicenseInfo? UserLicenseInfo { get; set; }

        public ICollection<Rental>? Rental { get; set; }
    }



}
