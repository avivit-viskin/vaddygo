using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IEventService — חוזה הלוגיקה העסקית של אירועי לוח השנה (BL).
      ה-Controller מדבר רק איתו — לעולם לא עם המסד ישירות.
    */
    public interface IEventService
    {
        Task<List<EventResponseDto>> GetAllAsync();
        Task<EventResponseDto?> GetByIdAsync(int id);
        Task<EventResponseDto> CreateAsync(EventCreateDto dto);
        Task<EventResponseDto?> UpdateAsync(int id, EventUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
