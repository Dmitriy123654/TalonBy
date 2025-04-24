using Domain.Models;
using System;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IRefreshTokenRepository
    {
        Task<RefreshToken> GetByTokenAsync(string token);
        Task<RefreshToken> CreateTokenAsync(RefreshToken refreshToken);
        Task UpdateTokenAsync(RefreshToken refreshToken);
        Task RevokeTokensForUserAsync(int userId);
        Task<bool> IsTokenValidAsync(string token, int userId);
        Task<int> CleanupExpiredTokensAsync();
    }
} 