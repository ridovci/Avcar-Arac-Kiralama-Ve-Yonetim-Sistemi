namespace AvciCarRental.DataLayer.Entities
{
    public class Brand
    {
        public int BrandId { get; set; }
        public string BrandName { get; set; }
        public ICollection<Model> Models { get; set; }

    }
}
