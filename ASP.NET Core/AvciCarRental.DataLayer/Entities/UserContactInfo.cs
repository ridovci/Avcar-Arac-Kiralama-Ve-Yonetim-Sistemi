using System.ComponentModel.DataAnnotations.Schema;

namespace AvciCarRental.DataLayer.Entities
{
    public class UserContactInfo
    {
        public int UserContactInfoId { get; set; }

        public string MobilePhone { get; set; }
    }
}
