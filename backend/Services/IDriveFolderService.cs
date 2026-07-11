using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IDriveFolderService — חוזה הלוגיקה העסקית של קישורי התיקיות (BL).
    */
    public interface IDriveFolderService
    {
        Task<List<DriveFolderResponseDto>> GetAllAsync(int? groupId = null);
        Task<DriveFolderResponseDto?> GetByIdAsync(int id);
        Task<DriveFolderResponseDto> CreateAsync(DriveFolderCreateDto dto, int? groupId = null);
        Task<DriveFolderResponseDto?> UpdateAsync(int id, DriveFolderUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
