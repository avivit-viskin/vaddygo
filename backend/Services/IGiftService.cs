using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IGiftService — חוזה הלוגיקה העסקית של המתנות (BL).
    */
    public interface IGiftService
    {
        Task<List<GiftResponseDto>> GetAllAsync();
        Task<GiftResponseDto?> GetByIdAsync(int id);
        Task<GiftResponseDto> CreateAsync(GiftCreateDto dto);
        Task<GiftResponseDto?> UpdateAsync(int id, GiftUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
