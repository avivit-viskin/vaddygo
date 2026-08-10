import { getUser, setLocalPlan } from "./authService";

/*
  plan.js — הבחנת חינם ↔ פרו.

  ליבת הוועד חינם, ומעליה מסלול פרו (₪149/שנה) של אוטומציות, עוזרת AI, כלים
  מתקדמים וניהול בקנה מידה גדול.

  ✅ האכיפה מופעלת (PRO_ENFORCED=true): פיצ'רי/עמודי פרו חסומים למי שאינה מנויה,
  ומפנים אותה לעמוד השדרוג. פתיחת פרו (למנהלת, עד חיבור סליקה אמיתית): מזינים את
  קוד הפתיחה במקום מספר כרטיס במסך התשלום → grantProLocally מסמן את המכשיר כמנוי.
*/

// מחיר המנוי השנתי לפרו (תואם למסמך התמחור; ניתן לשינוי)
export const PRO_PRICE = 149;

// מתג-אב לאכיפת פרו. true → פיצ'רי פרו נחסמים למי שאינה מנויה.
export const PRO_ENFORCED = true;

// קוד פתיחת פרו (מוזן במקום מספר כרטיס במסך התשלום) — שלב ביניים עד סליקה אמיתית.
export const PRO_UNLOCK_CODE = "1234";

// פיצ'רי הפרו שאושרו (מפתח → תווית עברית להצגה בעמוד השדרוג ובכל מקום אחר)
export const PRO_FEATURES = {
  ai: "עוזרת AI מלאה",
  multiInstitution: "ניהול כמה מוסדות בחשבון אחד",
  teamRoles: "תפקידי צוות והרשאות (מנהל/עורך/צופה)",
  bulkReminders: "תזכורת ובקשת תשלום גורפת לכל החייבים",
  budgetAssistant: "עוזרת תקציב חכמה (חגים ↔ מתנות)",
  receipts: "ניהול קבלות בצילום",
  reports: "דוחות, ייצוא ל-Excel והיסטוריה רב-שנתית",
  prioritySupport: "תמיכה מועדפת",
  // כלים ייעודיים (עמודים) שגם הם פרו
  reminders: "תזכורות אוטומטיות",
  polls: "סקרים והצבעות",
  backup: "גיבוי והשוואת שנים",
  branding: "מיתוג אישי לגן",
  contacts: "ספר קשרים ושליחה מרוכזת",
};

// מיפוי נתיב → מפתח פיצ'ר פרו, לחסימת עמודי פרו מרוכזת (ב-App).
export const PRO_ROUTES = {
  "/assistant": "ai",
  "/annual-report": "reports",
  "/reminders": "reminders",
  "/polls": "polls",
  "/backup": "backup",
  "/branding": "branding",
  "/contacts": "contacts",
};

// דגל פתיחת-פרו מקומי. בתוך namespace של vaadygo.* — ולכן נמחק אוטומטית כשמשתמש
// *אחר* מתחבר במכשיר (clearCachedAppData), אבל נשמר בכניסה חוזרת של אותו משתמש
// (כי plan מהשרת עדיין ריק). כך הפתיחה ב-1234 לא "נעלמת" בכל התחברות מחדש.
const PRO_UNLOCK_KEY = "vaadygo.proUnlock";

/* האם למשתמשת יש מנוי פרו. ברירת מחדל: לא (חינם). */
export function isPro() {
  try {
    if (localStorage.getItem(PRO_UNLOCK_KEY) === "1") {
      return true;
    }
  } catch {
    // אין localStorage — ממשיכים לבדוק לפי plan
  }
  return getUser()?.plan === "pro";
}

/* האם המפתח שייך לפיצ'רי הפרו */
export function isProFeature(key) {
  return Object.prototype.hasOwnProperty.call(PRO_FEATURES, key);
}

/*
  האם פיצ'ר חסום עבור המשתמשת כרגע. חסום רק אם ההבחנה מופעלת (PRO_ENFORCED),
  זהו פיצ'ר פרו, והמשתמשת אינה מנויה.
*/
export function isFeatureLocked(key) {
  return PRO_ENFORCED && isProFeature(key) && !isPro();
}

/* האם הנתיב הנוכחי הוא עמוד פרו חסום (למשתמשת שאינה מנויה). */
export function isRouteLocked(pathname) {
  const key = PRO_ROUTES[pathname];
  return key ? isFeatureLocked(key) : false;
}

/* פתיחת פרו מקומית — מסמן את המשתמשת כמנויה במכשיר הזה (נשמר גם בין כניסות). */
export function grantProLocally() {
  try {
    localStorage.setItem(PRO_UNLOCK_KEY, "1");
  } catch {
    // אין localStorage — לפחות נסמן על אובייקט המשתמש הנוכחי
  }
  setLocalPlan("pro");
}

/* ביטול פתיחת פרו מקומית (למשל לבדיקת המצב הנעול). */
export function revokeProLocally() {
  try {
    localStorage.removeItem(PRO_UNLOCK_KEY);
  } catch {
    // ignore
  }
  setLocalPlan("free");
}
