import { getUser } from "./authService";

/*
  plan.js — הבחנת חינם ↔ פרו (שלב א': תשתית בלבד).

  התוכנית אושרה במסמך "VaddyGo — חינם מול פרו": ליבת הוועד חינם, ומעליה מסלול
  פרו (₪149/שנה) של אוטומציות, עוזרת AI וניהול בקנה מידה גדול.

  ⚠️ עדיין *לא* נאכף: PRO_ENFORCED=false → כל הפיצ'רים פתוחים לכולם. הכתר 👑
  במסכים הוא סימון שיווקי בלבד ("מה יהיה פרו"). כשיוחלט להפעיל את ההבחנה
  (ואחרי שיהיה מנגנון תשלום/הענקת פרו) — מדליקים PRO_ENFORCED, ו-isFeatureLocked
  יתחיל לחסום פיצ'רי פרו למי שאינו מנוי.
*/

// מחיר המנוי השנתי לפרו (תואם למסמך התמחור; ניתן לשינוי)
export const PRO_PRICE = 149;

// מתג-אב: כל עוד false — שום פיצ'ר לא נחסם (רק תגית כתר מוצגת).
export const PRO_ENFORCED = false;

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
};

/* האם למשתמשת יש מנוי פרו. ברירת מחדל: לא (חינם). */
export function isPro() {
  return getUser()?.plan === "pro";
}

/* האם המפתח שייך לפיצ'רי הפרו */
export function isProFeature(key) {
  return Object.prototype.hasOwnProperty.call(PRO_FEATURES, key);
}

/*
  האם פיצ'ר חסום עבור המשתמשת כרגע. חסום רק אם ההבחנה מופעלת (PRO_ENFORCED),
  זהו פיצ'ר פרו, והמשתמשת אינה מנויה. בשלב א' (PRO_ENFORCED=false) — תמיד false.
*/
export function isFeatureLocked(key) {
  return PRO_ENFORCED && isProFeature(key) && !isPro();
}
