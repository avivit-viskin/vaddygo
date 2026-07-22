using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    public interface IGroupService
    {
        Task<List<GroupResponseDto>> GetAllAsync();
        Task<GroupResponseDto?> GetByIdAsync(int id);
        Task<GroupResponseDto> CreateAsync(GroupCreateDto dto);
        Task<GroupResponseDto?> UpdatePaymentLinksAsync(int id, GroupPaymentLinksDto dto);
        Task<GroupResponseDto?> UpdatePaymentProviderAsync(int id, GroupPaymentProviderDto dto);
        Task<GroupResponseDto?> UpdateBankAccountAsync(int id, GroupBankAccountDto dto);
        Task<GroupResponseDto?> UpdateCategoriesAsync(int id, GroupCategoriesUpdateDto dto);
        Task<GroupResponseDto?> UpdateHolidayBudgetsAsync(int id, Dictionary<string, decimal> budgets);
        Task<bool> DeleteAsync(int id);
    }
}
