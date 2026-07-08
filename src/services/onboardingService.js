/*
  onboardingService — שמירת הגדרות הגן מאשף ההרשמה.
  כל עוד אין מודל Group בשרת (המשימה השרתית של שלב 3), הנתונים נשמרים
  מקומית ב-localStorage; כשה-API יהיה מוכן, הפונקציות כאן יעברו לקרוא
  ל-services/api.js בלי שהמסכים יצטרכו להשתנות.
*/
const STORAGE_KEY = "vaadygo.onboarding";

export function getOnboarding() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveOnboarding(data) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...data, completedAt: new Date().toISOString() })
  );
}

export function isOnboardingComplete() {
  return getOnboarding() !== null;
}
