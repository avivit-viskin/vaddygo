import { useEffect } from "react";

/*
  UnsavedChangesGuard — מזהיר לפני יציאה כשיש שינויים שלא נשמרו בטופס.
  גנרי ולא-פולשני: מסמן "יש שינוי" בכל הקלדה/שינוי בשדה בדף, ומנקה את הסימון
  כששומרים (submit של טופס). כל עוד יש שינוי לא-שמור — רענון/סגירת הדף/יציאה
  יפעילו את חלון האזהרה של הדפדפן ("יש שינויים שלא נשמרו — לצאת בכל זאת?").
  מרונדר null; מספיק למקם אותו בתוך העמוד שרוצים להגן עליו (למשל עריכת הספק).
*/
function UnsavedChangesGuard() {
  useEffect(() => {
    let dirty = false;

    const markDirty = (event) => {
      const el = event.target;
      // רק שדות קלט אמיתיים (טקסט/מספר/בחירה) — לא לחיצות כפתור/טאב
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        dirty = true;
      }
    };
    // שמירה (submit של טופס) = אין יותר שינוי לא-שמור
    const markClean = () => {
      dirty = false;
    };
    const onBeforeUnload = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = ""; // נדרש כדי שהדפדפן יציג את אזהרת היציאה
        return "";
      }
      return undefined;
    };

    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    document.addEventListener("submit", markClean, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("input", markDirty, true);
      document.removeEventListener("change", markDirty, true);
      document.removeEventListener("submit", markClean, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return null;
}

export default UnsavedChangesGuard;
