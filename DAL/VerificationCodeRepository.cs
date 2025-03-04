using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Domain.Interfaces;
using Domain.Models;

namespace DAL
{
    public class VerificationCodeRepository : IVerificationCodeRepository
    {
        private readonly ApplicationContext _context;

        public VerificationCodeRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task SaveCode(VerificationCode code)
        {
            _context.VerificationCodes.Add(code);
            await _context.SaveChangesAsync();
        }

        public async Task<VerificationCode> GetLatestCode(string email)
        {
            return await _context.VerificationCodes
                .Where(v => v.Email == email)
                .OrderByDescending(v => v.ExpirationTime)
                .FirstOrDefaultAsync();
        }

        public async Task UpdateCode(VerificationCode code)
        {
            _context.VerificationCodes.Update(code);
            await _context.SaveChangesAsync();
        }
    }
} 