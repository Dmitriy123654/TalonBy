using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.ViewModels
{
    public class Result
    {
        public bool Succeeded { get; set; }
        public string[] Errors { get; set; } = Array.Empty<string>();
        public string Message 
        { 
            get => Errors.FirstOrDefault() ?? string.Empty;
            set => Errors = new[] { value };
        }
    }

    public class UserInfo
    {
        public string Email { get; set; }
    }
}
