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

        /* מחיקה רכה — ההוצאה עוברת לסל המיחזור (ניתנת לשחזור 30 יום). */
        Task<bool> DeleteAsync(int id);

        /* פריטי סל המיחזור של המוסד (שנמחקו ב-30 הימים האחרונים). */
        Task<List<ExpenseResponseDto>> GetTrashAsync(int? groupId = null);

        /* שחזור פריט מסל המיחזור חזרה לפעיל. */
        Task<bool> RestoreAsync(int id);

        /* מחיקה לצמיתות של פריט מסל המיחזור (בלתי הפיך). */
        Task<bool> PermanentDeleteAsync(int id);
    }
}
