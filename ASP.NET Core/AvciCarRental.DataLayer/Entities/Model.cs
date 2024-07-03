using System.ComponentModel.DataAnnotations.Schema;

namespace AvciCarRental.DataLayer.Entities
{
    public class Model
    {
        public int ModelId { get; set; }
        public int BrandId { get; set; }
        [ForeignKey("BrandId")]
        public Brand Brand { get; set; }
        public string ModelName { get; set; }

    }
}
