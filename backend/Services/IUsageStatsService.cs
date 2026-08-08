using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IUsageStatsService — חוזה נתוני השימוש למנהלת VaddyGo: משפך ההרשמה בשני
      הצדדים (ועדים וספקים). מחזיר מספרים מצטברים בלבד, בלי פרטים מזהים.
    */
    public interface IUsageStatsService
    {
        Task<UsageStatsDto> GetUsageAsync();
    }
}
