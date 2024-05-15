using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IReceptionStatusRepository
    {
        Task<List<ReceptionStatus>> GetAllAsync();
        Task<ReceptionStatus> GetByIdAsync(int id);
        Task<ReceptionStatus> GetByStatusAsync(Domain.Status status);
        Task AddAsync(ReceptionStatus receptionStatus);
        Task UpdateAsync(ReceptionStatus receptionStatus);
        Task DeleteAsync(int id);
    }
}
