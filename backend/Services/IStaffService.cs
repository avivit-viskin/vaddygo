using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IStaffService — חוזה הלוגיקה העסקית של אנשי הצוות (BL).
      ה-Controller מדבר רק איתו — לעולם לא עם המסד ישירות.
    */
    public interface IStaffService
    {
        Task<List<StaffMemberResponseDto>> GetAllAsync();
        Task<StaffMemberResponseDto?> GetByIdAsync(int id);
        Task<StaffMemberResponseDto> CreateAsync(StaffMemberCreateDto dto);
        Task<StaffMemberResponseDto?> UpdateAsync(int id, StaffMemberUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
