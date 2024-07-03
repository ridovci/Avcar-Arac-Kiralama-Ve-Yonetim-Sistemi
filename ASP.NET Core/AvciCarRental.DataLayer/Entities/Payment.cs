using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AvciCarRental.DataLayer.Entities
{
    public class Payment
    {
        public int PaymentId { get; set; }
        public int RentalId {  get; set; }
        [ForeignKey("RentalId")]
        public Rental Rental { get; set; }
        public DateTime PaymentDate {  get; set; }
        public decimal PaymentAmount { get; set; }
        public PaymentStatuses PaymentStatus { get; set; }
        public string TransactionId {  get; set; }
        public PaymentMethods PaymentMethod { get; set; } // Bu daha açıklayıcı olabilir

        public enum PaymentStatuses {
            Pending,
            Completed,
            Failed,
            Cancelled
        }

        public enum PaymentMethods
        {
            CreditCard,
            BankTransfer
        }


    }
}
