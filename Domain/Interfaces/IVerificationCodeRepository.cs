using Domain.Models;

namespace Domain.Interfaces
{
    public interface IVerificationCodeRepository
    {
        Task SaveCode(VerificationCode code);
        Task<VerificationCode> GetLatestCode(string email);
        Task UpdateCode(VerificationCode code);
    }
}