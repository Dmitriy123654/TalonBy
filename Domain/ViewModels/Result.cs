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
        public IEnumerable<string> Errors { get; set; }
    }

    public class LoginResult : Result
    {
        public string Token { get; set; }

    }
}
