using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IVendorService — חוזה הלוגיקה העסקית של הספקים (BL).
    */
    public interface IVendorService
    {
        Task<List<VendorResponseDto>> GetAllAsync();
        Task<VendorResponseDto?> GetByIdAsync(int id);
        Task<VendorResponseDto> CreateAsync(VendorCreateDto dto);
        Task<VendorResponseDto?> UpdateAsync(int id, VendorUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
