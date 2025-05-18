using System;
using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class StatusUpdateModel
    {
        [Required]
        public int AppointmentId { get; set; }
        
        [Required]
        public int ReceptionStatusId { get; set; }
        
        public string? FileResultLink { get; set; }
    }
} 