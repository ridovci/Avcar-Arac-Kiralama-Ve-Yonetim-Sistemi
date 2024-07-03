namespace AvciCarRental.Api.DTOs
{
    public class PaymentDto
    {
        public int PaymentId { get; set; }
        public int RentalId { get; set; }
        public DateTime PaymentDate { get; set; }
        public decimal PaymentAmount { get; set; }
        public string PaymentStatus { get; set; }
        public string TransactionId { get; set; }
        public string PaymentMethod { get; set; }
    }
}
