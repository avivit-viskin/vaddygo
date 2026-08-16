using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      VendorProPolicy — הכלל היחיד שקובע האם לספק יש מסלול פרו **פעיל** כרגע.
      מקביל ל-ProPolicy של הגן (מקור אמת אחד, כדי שספק לא ייראה מנוי במקום אחד
      ולא-מנוי באחר).

      פרו פעיל = הדגל דלוק **וגם** התוקף לא עבר. תוקף null = פתיחה ידנית של
      המנהלת (בלי תאריך תפוגה) ולכן נחשב פעיל. כך פיצ'רי הפרו של הספק נכבים
      אוטומטית כשהמנוי פג (למשל 30.8), בדיוק כמו אצל הוועד.
    */
    public static class VendorProPolicy
    {
        public static bool IsActive(Vendor? vendor)
        {
            if (vendor == null || !vendor.IsPro)
            {
                return false;
            }
            // התוקף "עד סוף היום" — משווים לפי תאריך (לא שעה), כדי שמנוי שתקף
            // "עד 30.8" לא ייסגר בבוקר של אותו יום.
            return vendor.ProValidUntil == null
                || vendor.ProValidUntil.Value.Date >= DateTime.UtcNow.Date;
        }
    }
}
