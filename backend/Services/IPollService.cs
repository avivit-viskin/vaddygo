using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IPollService — סקרים של הוועד + הצבעה ציבורית של הורים.
      הפעולות של הוועד מוגבלות לגן שלו; הפעולות הציבוריות מזוהות רק בטוקן הסקר.
    */
    public interface IPollService
    {
        /* הסקרים של הגן הנוכחי, החדש קודם. */
        Task<IEnumerable<PollResponseDto>> GetAllAsync(int? groupId = null);

        Task<PollResponseDto?> CreateAsync(PollCreateDto dto, int? groupId = null);

        /* פתיחה/סגירה לתשובות. null אם הסקר אינו של המשתמש. */
        Task<PollResponseDto?> SetClosedAsync(int id, bool isClosed);

        /* true אם נמחק; false אם לא נמצא או אינו של המשתמש. */
        Task<bool> DeleteAsync(int id);

        /* הסקר כפי שהורה רואה אותו בקישור הציבורי. null אם הטוקן לא קיים. */
        Task<PublicPollDto?> GetPublicAsync(string token);

        /*
          הצבעת הורה. מחזיר את הסקר המעודכן, או הודעת שגיאה ידידותית:
          סקר לא קיים / סגור / אפשרות לא שייכת לסקר / כבר הצביעו מהמכשיר הזה.
        */
        Task<(PublicPollDto? Poll, string? Error)> VoteAsync(string token, PollVoteDto dto);
    }
}
