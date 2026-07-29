import { useCallback, useEffect, useRef } from "react";

/*
  useUnsavedGuard — שומר מפני יציאה/מעבר מהטופס כשיש שינויים שלא נשמרו.

  מכסה את כל הדרכים לעזוב:
    • מעבר טאב / התנתקות (ניווט פנימי) — קוראים ל-confirmDiscard() לפני הניווט.
    • כפתור "חזור" (דפדפן/נייד) — סנטינל בהיסטוריה שנתפס ב-popstate ושואל.
    • רענון / סגירת טאב (מחשב) — אזהרת הדפדפן (beforeunload).

  לא מתערב כשאין שינוי — כדי שמעבר טאב ו"חזור" יעבדו חלק. מסמן "יש שינוי" בכל
  הקלדה/שינוי בשדה, ומנקה כששומרים (submit של טופס).

  שימוש:
    const { confirmDiscard } = useUnsavedGuard();
    ... בתחילת goTo / handleLogout:  if (!confirmDiscard()) return;
*/
const MESSAGE = "לא לחצת שמור, האם להמשיך בכל זאת?";

export default function useUnsavedGuard() {
  const dirtyRef = useRef(false);
  const armedRef = useRef(false); // האם הוספנו סנטינל להיסטוריה לתפיסת "חזור"

  // לקריאה לפני ניווט פנימי (מעבר טאב / התנתקות): מחזיר true אם מותר להמשיך.
  const confirmDiscard = useCallback(() => {
    if (!dirtyRef.current) return true;
    // eslint-disable-next-line no-alert
    if (window.confirm(MESSAGE)) {
      dirtyRef.current = false;
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const isField = (el) =>
      !!el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable);

    // סנטינל = כפילות של הכתובת הנוכחית. פופ שלו לא משנה תצוגה (אותה כתובת),
    // רק נותן הזדמנות לשאול לפני שממשיכים אחורה באמת.
    const arm = () => {
      if (!armedRef.current) {
        window.history.pushState(null, "");
        armedRef.current = true;
      }
    };

    const markDirty = (event) => {
      if (isField(event.target)) {
        dirtyRef.current = true;
        arm();
      }
    };
    // שמירה (submit של טופס) = אין יותר שינוי לא-שמור
    const markClean = () => {
      dirtyRef.current = false;
    };

    // כפתור "חזור" (עובד בנייד)
    const onPopState = () => {
      if (!armedRef.current) return; // אין שינוי / לא חימשנו — ניווט רגיל
      armedRef.current = false;
      if (
        dirtyRef.current &&
        // eslint-disable-next-line no-alert
        !window.confirm(MESSAGE)
      ) {
        arm(); // נשארים — מחזירים סנטינל לתפוס גם את ה"חזור" הבא
        return;
      }
      // יוצאים (או שכבר נשמר) — ממשיכים אחורה באמת: לטאב הקודם / החוצה
      dirtyRef.current = false;
      window.history.back();
    };

    // רענון / סגירת דף (מחשב)
    const onBeforeUnload = (event) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = MESSAGE; // הטקסט עצמו נשלט ע"י הדפדפן
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

  return { confirmDiscard };
}
