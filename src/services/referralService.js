/*
  referralService — "קוד הפניה" (referral): מי שהגיע להרשמה דרך קישור עם
  ?ref=CODE — הקוד נלכד ונשמר במכשיר, ונשלח בהרשמה כדי שהמנהלת תראה מכל
  לקוח/שותף כמה נרשמו. הקוד חופשי (כל טקסט שהמנהלת בוחרת לכל לקוח).

  זרימה: RegisterPage לוכד את הקוד מהכתובת בעת הכניסה → נשמר ב-localStorage →
  authService.register שולח אותו לשרת → אחרי הרשמה מוצלחת מנקים אותו.
*/
const KEY = "vaadygo.referral";
const MAX_LEN = 60;

/* לוכד ?ref= מכתובת (search string) ושומר אותו במכשיר, אם קיים. */
export function captureReferralFromUrl(search) {
  try {
    const raw = new URLSearchParams(search || "").get("ref");
    const code = (raw || "").trim().slice(0, MAX_LEN);
    if (code) {
      localStorage.setItem(KEY, code);
    }
  } catch {
    // אין localStorage / כתובת לא תקינה — פשוט לא לוכדים
  }
}

/* מחזיר את קוד ההפניה השמור (או "" אם אין). */
export function getReferralCode() {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

/* מנקה את קוד ההפניה (אחרי שנשלח בהרשמה, כדי שלא ידבק להרשמה הבאה במכשיר). */
export function clearReferralCode() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
