using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IDriveFolderService — חוזה הלוגיקה העסקית של קישורי התיקיות (BL).
    */
    public interface IDriveFolderService
    {
        Task<List<DriveFolderResponseDto>> GetAllAsync();
        Task<DriveFolderResponseDto?> GetByIdAsync(int id);
        Task<DriveFolderResponseDto> CreateAsync(DriveFolderCreateDto dto);
        Task<DriveFolderResponseDto?> UpdateAsync(int id, DriveFolderUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
