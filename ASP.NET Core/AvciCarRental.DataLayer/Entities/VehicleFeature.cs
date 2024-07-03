using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AvciCarRental.DataLayer.Entities
{
    public class VehicleFeature
    {
        public int VehicleFeatureId { get; set; }
        public string VehicleFeatureName { get; set; }
        // Çoktan çoğa ilişki için navigasyon özelliği
        public ICollection<VehicleFeatureAssignment> VehicleFeatureAssignments { get; set; }

    }
}
