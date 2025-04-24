using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.ViewModels
{
    public class LoginResult : Result
    {
        public new bool Succeeded { get; set; }
        public new string Message { get; set; }
        public int UserId { get; set; }
        public string Token { get; set; }  // Для генерации JWT токена
    }
} 