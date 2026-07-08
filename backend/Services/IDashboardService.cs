using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IDashboardService — חוזה סיכום מסך הבית. מחזיר null כשעוד לא הוגדר גן
      (לפני השלמת אשף ההרשמה).
    */
    public interface IDashboardService
    {
        Task<DashboardResponseDto?> GetSummaryAsync();
    }
}
