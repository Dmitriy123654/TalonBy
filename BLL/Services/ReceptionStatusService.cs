using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Services
{
    public interface IReceptionStatusService
    {
        Task<List<ReceptionStatusModel>> GetAllReceptionStatusesAsync();
        Task<ReceptionStatusModel> GetReceptionStatusByIdAsync(int id);
        Task<ReceptionStatusModel> GetReceptionStatusByStatusAsync(Domain.Status status);
        Task CreateReceptionStatusAsync(ReceptionStatusModel receptionStatusModel);
        Task UpdateReceptionStatusAsync(ReceptionStatusModel receptionStatusModel);
        Task DeleteReceptionStatusAsync(int id);
    }
    public class ReceptionStatusService : IReceptionStatusService
    {
        private readonly IReceptionStatusRepository _receptionStatusRepository;

        public ReceptionStatusService(IReceptionStatusRepository receptionStatusRepository)
        {
            _receptionStatusRepository = receptionStatusRepository;
        }

        public async Task<List<ReceptionStatusModel>> GetAllReceptionStatusesAsync()
        {
            var receptionStatuses = await _receptionStatusRepository.GetAllAsync();
            return receptionStatuses.Select(rs => new ReceptionStatusModel { Status = rs.Status }).ToList();
        }

        public async Task<ReceptionStatusModel> GetReceptionStatusByIdAsync(int id)
        {
            var receptionStatus = await _receptionStatusRepository.GetByIdAsync(id);
            if (receptionStatus == null)
                return null;

            return new ReceptionStatusModel { Status = receptionStatus.Status };
        }

        public async Task<ReceptionStatusModel> GetReceptionStatusByStatusAsync(Domain.Status status)
        {
            var receptionStatus = await _receptionStatusRepository.GetByStatusAsync(status);
            if (receptionStatus == null)
                return null;


            return new ReceptionStatusModel { Status = receptionStatus.Status };
        }

        public async Task CreateReceptionStatusAsync(ReceptionStatusModel receptionStatusModel)
        {
            var receptionStatus = new ReceptionStatus { Status = receptionStatusModel.Status };
            await _receptionStatusRepository.AddAsync(receptionStatus);
        }

        public async Task UpdateReceptionStatusAsync(ReceptionStatusModel receptionStatusModel)
        {
            var receptionStatus = await _receptionStatusRepository.GetByStatusAsync(receptionStatusModel.Status);
            if (receptionStatus == null)
                throw new ArgumentException("Статус приема не найден");

            receptionStatus.Status = receptionStatusModel.Status;
            await _receptionStatusRepository.UpdateAsync(receptionStatus);
        }

        public async Task DeleteReceptionStatusAsync(int id)
        {
            await _receptionStatusRepository.DeleteAsync(id);
        }
    }
}
