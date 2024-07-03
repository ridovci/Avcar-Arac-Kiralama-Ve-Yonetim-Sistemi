using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AvciCarRental.DataLayer.Entities
{
    public class Log
    {
        public int LogId { get; set; }
        public int? UserId { get; set; } 
        public User? User { get; set; }
        public string Action { get; set; }
        public string IpAddress { get; set; }
        public DateTime ActionDate { get; set; }
    }

}
