using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AvciCarRental.DataLayer.Entities
{
    public class AdditionalRentalProductAssignment
    {
        public int AdditionalRentalProductId { get; set; }
        [ForeignKey("AdditionalRentalProductId")]
        public AdditionalRentalProduct AdditionalRentalProduct { get; set; }
        public int RentalId { get; set; }
        [ForeignKey("RentalId")]
        public Rental Rental { get; set; }
    }
}
