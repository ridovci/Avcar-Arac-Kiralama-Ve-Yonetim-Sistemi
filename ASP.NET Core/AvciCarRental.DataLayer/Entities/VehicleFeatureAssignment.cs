using AvciCarRental.DataLayer.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

// Vehicle ve VehicleFeatures arasında çoktan çoğa (many-to-many) ilişki kurmanız gerekiyor.
// Bunun için bir ara tablo (junction table) oluşturduk.

namespace AvciCarRental.DataLayer.Entities
{
    public class VehicleFeatureAssignment
    {
        public int VehicleId { get; set; }
        [ForeignKey("VehicleId")]
        public Vehicle Vehicle { get; set; }
        public int VehicleFeaturesId { get; set; }
        [ForeignKey("VehicleFeaturesId")]
        public VehicleFeature VehicleFeatures { get; set; }


    }
}
