using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      ProPolicy — הכלל היחיד שקובע האם למוסד יש מסלול פרו **פעיל** כרגע.

      מרוכז במקום אחד בכוונה: הדגל נבדק בכמה מקומות (חסימת פיצ'רים, מה שמוחזר
      ללקוח, מסך המנהלת), ואם כל אחד יחשב בעצמו — מוסד יוכל להיראות מנוי במקום
      אחד ולא-מנוי באחר.

      פרו פעיל = הדגל דלוק **וגם** התוקף לא עבר. תוקף null = בלי תאריך תפוגה
      (פתיחה ידנית של המנהלת), ולכן נחשב פעיל.
    */
    public static class ProPolicy
    {
        public static bool IsActive(Group? group)
        {
            if (group == null || !group.IsPro)
            {
                return false;
            }
            // התוקף הוא "עד סוף היום" — משווים לפי תאריך, לא לפי שעה, כדי שמנוי
            // שתקף "עד 10.08" לא ייסגר בבוקר של אותו יום.
            return group.ProValidUntil == null
                || group.ProValidUntil.Value.Date >= DateTime.UtcNow.Date;
        }
    }
}
