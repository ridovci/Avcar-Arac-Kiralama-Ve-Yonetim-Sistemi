using System.ComponentModel.DataAnnotations.Schema;

namespace AvciCarRental.DataLayer.Entities
{
    public class UserLicenseInfo
    {
        public int UserLicenseInfoId { get; set; }

        public DateTime DriverLicenseIssueDate { get; set; }
        public string DriverLicenseClass { get; set; }
        public string DriverLicenseNumber { get; set; }
    }

    //DriverLicenseClass
    //A, A1, A2, M, B, B1, BE, C, C1, CE, C1E, D, D1, DE, D1E, G ve F

}
