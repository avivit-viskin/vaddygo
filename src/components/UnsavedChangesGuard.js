import { useEffect } from "react";

/*
  UnsavedChangesGuard — מזהיר לפני יציאה כשיש שינויים שלא נשמרו בטופס.
  גנרי ולא-פולשני: מסמן "יש שינוי" בכל הקלדה/שינוי בשדה, ומנקה כששומרים
  (submit של טופס). מזהיר בשני מסלולים כדי שיעבוד גם בנייד:
    1. כפתור "חזור" של הדפדפן/הנייד — חלון אישור ("לצאת בכל זאת?") דרך popstate.
       (beforeunload לבדו לא עובד ב-Safari בנייד ולא נתפס בניווט פנימי.)
    2. רענון / סגירת טאב / יציאה מהאתר — אזהרת הדפדפן (beforeunload) במחשב.
  מרונדר null; מספיק למקם אותו בעמוד שרוצים להגן עליו (עריכת הספק).
*/
function UnsavedChangesGuard() {
  useEffect(() => {
    let dirty = false;

    const isField = (el) =>
      !!el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable);

    const markDirty = (event) => {
      if (isField(event.target)) dirty = true;
    };
    // שמירה (submit של טופס) = אין יותר שינוי לא-שמור
    const markClean = () => {
      dirty = false;
    };

    // ── מסלול 1: כפתור "חזור" (עובד בנייד) ──
    // מוסיפים "סנטינל" להיסטוריה, כך שלחיצת "חזור" נוחתת אצלנו (popstate) ולא
    // מוציאה מהעמוד לפני שנשאל. באישור — יוצאים באמת; בביטול — נשארים.
    window.history.pushState(null, "");
    const onPopState = () => {
      if (
        dirty &&
        // eslint-disable-next-line no-alert
        !window.confirm("יש שינויים שלא נשמרו. לצאת בכל זאת?")
      ) {
        // נשארים — מחזירים את הסנטינל כדי לתפוס גם את ה"חזור" הבא
        window.history.pushState(null, "");
        return;
      }
      // יוצאים (או שאין שינויים) — משחררים וממשיכים אחורה באמת
      dirty = false;
      window.removeEventListener("popstate", onPopState);
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
