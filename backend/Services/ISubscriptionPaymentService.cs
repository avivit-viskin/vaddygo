namespace ParentCommitteeAPI.Services
{
    /*
      ISubscriptionPaymentService — חוזה חיבור סליקת המנוי (Grow). זהו ה"שקע"
      שאליו ייכנס המימוש בפועל כשמחברים את הסליקה (GrowSubscriptionPaymentService):
      פתיחת עמוד תשלום ב-Grow, ואימות הקולבק (webhook) של Grow לפני הארכת המנוי.
      אחרי אימות מוצלח קוראים ל-AuthService.RenewSubscriptionAsync כדי להאריך בחודש.

      נבנה כעת רק החוזה — כדי שמחר החיבור יהיה מילוי פרטים בלבד (ראו GrowSettings).
    */
    public interface ISubscriptionPaymentService
    {
        /*
          פותח תשלום חידוש ב-Grow ומחזיר את כתובת עמוד התשלום שאליו מפנים את
          המשתמשת. returnUrl — הכתובת שאליה Grow יחזיר אחרי התשלום.
        */
        Task<string> CreateRenewalPaymentUrlAsync(int userId, string returnUrl);

        /*
          מאמת קולבק (webhook) מ-Grow מול הסוד (Secret) ומוודא שהתשלום באמת עבר.
          מחזיר את מזהה המשתמש לחידוש אם התשלום אומת, אחרת null (לא מאריכים).
        */
        Task<int?> VerifyCallbackAsync(IDictionary<string, string> payload);
    }
}
