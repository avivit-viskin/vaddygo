/*
  notificationPrefs — העדפות ההתראות של המשתמשת (משימה 12). נשמר ב-localStorage.
  ברירת מחדל: הכל דלוק. כיבוי מסתיר את סוג ההתראה מהפעמון ומהמסכים.
*/
const KEY = "vaadygo.notificationPrefs";
const DEFAULTS = { payments: true, birthdays: true };

export function getNotificationPrefs() {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setNotificationPref(key, value) {
  const next = { ...getNotificationPrefs(), [key]: value };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
