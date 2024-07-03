using System.ComponentModel.DataAnnotations.Schema;

namespace AvciCarRental.DataLayer.Entities
{
    public class UserPersonalInfo
    {
        public int UserPersonalInfoId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public int GenderCode { get; set; } // ISO/IEC 5218
        public DateTime DateOfBirth { get; set; }
    }

    //GenderCode
    //0 = Not known;
    //1 = Male;
    //2 = Female;
    //9 = Not applicable;
}
