using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class ReceptionStatusRepository : IReceptionStatusRepository
    {
        private readonly ApplicationContext _context;

        public ReceptionStatusRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task<List<ReceptionStatus>> GetAllAsync()
        {
            return await _context.ReceptionStatuses.ToListAsync();
        }

        public async Task<ReceptionStatus> GetByIdAsync(int id)
        {
            return await _context.ReceptionStatuses.FindAsync(id);
        }

        public async Task<ReceptionStatus> GetByStatusAsync(Domain.Status status)
        {
            return await _context.ReceptionStatuses.FirstOrDefaultAsync(rs => rs.Status == status);
        }

        public async Task AddAsync(ReceptionStatus receptionStatus)
        {
            await _context.ReceptionStatuses.AddAsync(receptionStatus);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ReceptionStatus receptionStatus)
        {
            _context.ReceptionStatuses.Update(receptionStatus);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var receptionStatus = await _context.ReceptionStatuses.FindAsync(id);
            if (receptionStatus != null)
            {
                _context.ReceptionStatuses.Remove(receptionStatus);
                await _context.SaveChangesAsync();
            }
        }
    }
}
