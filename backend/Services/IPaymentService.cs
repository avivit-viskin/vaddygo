using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IPaymentService — הלוגיקה העסקית של תשלומי תלמיד לפי קטגוריות הגבייה.
    */
    public interface IPaymentService
    {
        /* מצב התשלומים של תלמיד — שורה לכל קטגוריית גבייה של הגן.
           null כשהתלמיד לא נמצא. */
        Task<List<PaymentResponseDto>?> GetForStudentAsync(int studentId);

        /* מצב התשלומים של *כל* תלמידי הגן בבקשה אחת (שורה לכל תלמיד×קטגוריה) —
           לחישוב תגי "שולם X/Y" ולתזכורות, בלי בקשה נפרדת לכל תלמיד. */
        Task<List<PaymentResponseDto>> GetAllForGroupAsync(int? groupId = null);

        /* יצירה/עדכון של תשלום עבור (תלמיד, קטגוריה).
           null כשהתלמיד או הקטגוריה לא נמצאו. */
        Task<PaymentResponseDto?> UpsertAsync(int studentId, int categoryId, PaymentUpsertDto dto);
    }
}
