import { useEffect } from "react";

/*
  UnsavedChangesGuard — מזהיר לפני יציאה כשיש שינויים שלא נשמרו בטופס.
  גנרי ולא-פולשני: מסמן "יש שינוי" בכל הקלדה/שינוי בשדה, ומנקה כששומרים (submit).

  חשוב: מתערב בכפתור "חזור" *רק* כשיש שינוי שלא נשמר. כשאין שינוי — לא נוגעים,
  כדי ש"חזור" יחזור חלק לטאב/מסך הקודם (הטאבים נשמרים בכתובת ?tab=). כשיש שינוי,
  מוסיפים "סנטינל" בהיסטוריה (עם אותה כתובת) כדי לתפוס את ה"חזור" ולשאול תחילה.

  שני מסלולים כדי שיעבוד גם בנייד:
    1. כפתור "חזור" (דפדפן/נייד) — חלון אישור ("לצאת בכל זאת?") דרך popstate.
    2. רענון / סגירת טאב — אזהרת הדפדפן (beforeunload) במחשב.
  מרונדר null; מספיק למקם אותו בעמוד שרוצים להגן עליו (עריכת הספק).
*/
function UnsavedChangesGuard() {
  useEffect(() => {
    let dirty = false;
    let armed = false; // האם הוספנו סנטינל להיסטוריה לתפיסת "חזור"

    const isField = (el) =>
      !!el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable);

    // סנטינל = כפילות של הכתובת הנוכחית. פופ שלו לא משנה תצוגה (אותה כתובת),
    // רק נותן לנו הזדמנות לשאול לפני שממשיכים אחורה באמת.
    const arm = () => {
      if (!armed) {
        window.history.pushState(null, "");
        armed = true;
      }
    };

    const markDirty = (event) => {
      if (isField(event.target)) {
        dirty = true;
        arm();
      }
    };
    // שמירה (submit של טופס) = אין יותר שינוי לא-שמור
    const markClean = () => {
      dirty = false;
    };

    // ── מסלול 1: כפתור "חזור" (עובד בנייד) ──
    const onPopState = () => {
      if (!armed) return; // אין שינוי / לא חימשנו — ניווט רגיל, לא מתערבים
      armed = false;
      if (
        dirty &&
        // eslint-disable-next-line no-alert
        !window.confirm("יש שינויים שלא נשמרו. לצאת בכל זאת?")
      ) {
        arm(); // נשארים — מחזירים סנטינל לתפוס גם את ה"חזור" הבא
        return;
      }
      // יוצאים (או שכבר נשמר) — ממשיכים אחורה באמת: לטאב הקודם / החוצה
      dirty = false;
      window.history.back();
    };

    // ── מסלול 2: רענון / סגירת דף (מחשב) ──
    const onBeforeUnload = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "יש שינויים שלא נשמרו"; // הטקסט נשלט ע"י הדפדפן
        return event.returnValue;
      }
      return undefined;
    };

    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    document.addEventListener("submit", markClean, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("change", markDirty, true);
      document.removeEventListener("submit", markClean, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return null;
}

export default UnsavedChangesGuard;
