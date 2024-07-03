using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AvciCarRental.DataLayer.Entities
{
    public class Rental
    {
        public int RentalId { get; set; }
        public int VehicleId { get; set; }
        [ForeignKey("VehicleId")]
        public Vehicle Vehicle { get; set; }
        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; }
        public int DepartureLocationId { get; set; }
        [ForeignKey("DepartureLocationId")]
        public Location DepartureLocation { get; set; }

        public int ArrivalLocationId { get; set; }
        [ForeignKey("ArrivalLocationId")]
        public Location ArrivalLocation { get; set; }
        public DateTime RentalDate { get; set; }
        public DateTime ReturnDate { get; set; }
        public DateTime RequestDate { get; set; }
        public DateTime? AdminActionDate { get; set; }

        public RentalStatus Status { get; set; }
        public int? AdminUserId { get; set; }

        public ICollection<AdditionalRentalProductAssignment> AdditionalRentalProductAssignments { get; set; }

    }

    public enum RentalStatus
    {
        Approved,
        Cancelled,
        Completed,
        Pending
    }
}

