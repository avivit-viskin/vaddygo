import { api } from "./api";

/*
  twoFactorService — ניהול האימות הדו-שלבי של החשבון המחובר (מסך ההגדרות).
  שלב הכניסה עצמו יושב ב-authService, כי שם עדיין אין משתמש מחובר.

  שימי לב: `enable` ו-`regenerateBackupCodes` מחזירים את קודי הגיבוי — זו
  **הפעם היחידה שהם מגיעים מהשרת**. אי אפשר לבקש אותם שוב, רק להנפיק חדשים.
*/

/* מצב האימות: דלוק/כבוי, באיזה ערוץ, כמה קודי גיבוי נותרו. */
export function getTwoFactorStatus() {
  return api.get("/api/auth/2fa");
}

/* שלב 1 בהפעלה — שולח קוד לערוץ הנבחר כדי לוודא שהוא באמת מגיע. */
export function startTwoFactorSetup({ channel, phone }) {
  return api.post("/api/auth/2fa/setup", { channel, phone });
}

/* שלב 2 — מפעיל ומחזיר את קודי הגיבוי. */
export function enableTwoFactor({ challengeId, code }) {
  return api.post("/api/auth/2fa/enable", { challengeId, code });
}

/* כיבוי. דורש סיסמה גם למשתמשת מחוברת — מסך פתוח לרגע לא יספיק. */
export function disableTwoFactor(password) {
  return api.post("/api/auth/2fa/disable", { password });
}

/* סט קודי גיבוי חדש. הישן מתבטל באותו רגע. */
export function regenerateBackupCodes(password) {
  return api.post("/api/auth/2fa/backup-codes", { password });
}

/* ניתוק כל המכשירים הזכורים — בכניסה הבאה יידרש קוד בכל אחד מהם. */
export function forgetTrustedDevices(password) {
  return api.post("/api/auth/2fa/forget-devices", { password });
}
