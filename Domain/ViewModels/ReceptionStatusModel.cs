using Domain.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.ViewModels
{
    public class ReceptionStatusModel
    {

        [Required]
        [Range(0,2)]
        public Domain.Status Status { get; set; }

    }
}
