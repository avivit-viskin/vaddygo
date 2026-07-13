using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IExpenseService — חוזה הלוגיקה העסקית של הוצאות הקופה (BL).
      הסינון והבעלות נגזרים מהמשתמש המחובר (IAccessScope), לא מערך גולמי מהלקוח.
    */
    public interface IExpenseService
    {
        Task<List<ExpenseResponseDto>> GetAllAsync(int? groupId = null);
        Task<ExpenseResponseDto> CreateAsync(ExpenseCreateDto dto, int? groupId = null);
        Task<bool> DeleteAsync(int id);
    }
}
