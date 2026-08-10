using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    public interface IGroupService
    {
        Task<List<GroupResponseDto>> GetAllAsync();
        Task<GroupResponseDto?> GetByIdAsync(int id);
        Task<GroupResponseDto> CreateAsync(GroupCreateDto dto);
        Task<GroupResponseDto?> UpdateNameAsync(int id, GroupNameDto dto);
        Task<GroupResponseDto?> UpdatePaymentLinksAsync(int id, GroupPaymentLinksDto dto);
        Task<GroupResponseDto?> UpdatePaymentProviderAsync(int id, GroupPaymentProviderDto dto);
        Task<GroupResponseDto?> UpdateBankAccountAsync(int id, GroupBankAccountDto dto);
        Task<GroupResponseDto?> UpdateCategoriesAsync(int id, GroupCategoriesUpdateDto dto);
        Task<GroupResponseDto?> UpdateHolidayBudgetsAsync(int id, Dictionary<string, decimal> budgets);
        /*
          פתיחה/סגירה של מסלול פרו למוסד. שמור למנהלת VaddyGo (נאכף בקונטרולר),
          או לאישור תשלום מאומת. validUntil=null → בלי תאריך תפוגה.
          שים לב: אין כאן בדיקת בעלות בכוונה — המנהלת מנהלת מוסדות של לקוחות.
        */
        Task<GroupResponseDto?> SetProAsync(int id, bool isPro, DateTime? validUntil);

        Task<bool> DeleteAsync(int id);
    }
}
