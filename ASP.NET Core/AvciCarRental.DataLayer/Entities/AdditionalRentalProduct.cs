using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AvciCarRental.DataLayer.Entities
{
    public class AdditionalRentalProduct
    {
        public int AdditionalRentalProductId { get; set; }
        public string AdditionalRentalProductName { get; set; }
        public string AdditionalRentalProductDescription { get; set; }
        public decimal AdditionalRentalProductFee { get; set; }

        public ICollection<AdditionalRentalProductAssignment> AdditionalRentalProductAssignments { get; set; }

    }
}
