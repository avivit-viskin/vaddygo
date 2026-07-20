import * as Sentry from "@sentry/react";

/*
  monitoring — מעקב שגיאות בזמן אמת (Sentry). אם מוגדר מפתח בסביבה
  (REACT_APP_SENTRY_DSN) — מאתחלים את Sentry, וכל תקלה שנתפסת נשלחת אליו עם
  התראה, כדי שנדע על כל נפילה מיד. בלי מפתח — הניטור *כבוי לגמרי* ואין לו שום
  השפעה על האפליקציה. כך אפשר להפעיל אותו בהמשך רק ע"י הוספת המפתח, בלי שינוי קוד.
*/
let enabled = false;

export function initMonitoring() {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) {
    return; // אין מפתח — הניטור נשאר כבוי
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0, // מתמקדים בתקלות בלבד, בלי דגימת ביצועים
  });
  enabled = true;
}

/* שולח תקלה לניטור (אם הוא מופעל). נקרא מ-errorReporter. */
export function captureError(error, info) {
  if (!enabled) {
    return;
  }
  Sentry.captureException(error, {
    extra: { componentStack: info?.componentStack },
  });
}
