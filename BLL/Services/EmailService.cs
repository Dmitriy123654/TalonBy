using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace BLL.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        private readonly string _smtpServer;
        private readonly int _smtpPort;
        private readonly string _fromEmail;
        private readonly string _password;

        public EmailService(IConfiguration configuration)
        {
            _smtpServer = configuration["Email:SmtpServer"];
            _smtpPort = int.Parse(configuration["Email:SmtpPort"]);
            _fromEmail = configuration["Email:FromEmail"];
            _password = configuration["Email:Password"];
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            using var message = new MailMessage(_fromEmail, to)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            using var client = new SmtpClient(_smtpServer, _smtpPort)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_fromEmail, _password)
            };

            await client.SendMailAsync(message);
        }
    }
}