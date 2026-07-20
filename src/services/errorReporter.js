/*
  errorReporter — נקודה מרכזית אחת לדיווח על תקלות באפליקציה.

  כרגע כותב ללוג הדפדפן. זה גם ה"וו" (seam) לחיבור עתידי לשירות ניטור בזמן אמת
  (למשל Sentry): כשיהיה חשבון + מפתח, נוסיף כאן שורה אחת — Sentry.captureException —
  וכל תקלה שנתפסת באפליקציה תגיע אליו אוטומטית, כדי שנדע על כל נפילה מיד.
*/
import { captureError } from "./monitoring";

export function reportError(error, info) {
  const details = info && info.componentStack ? info.componentStack : "";
  // eslint-disable-next-line no-console
  console.error("[VaddyGo] תקלה נתפסה:", error, details);
  // שולח לניטור בזמן אמת (Sentry) — פעיל רק אם הוגדר מפתח בסביבה
  captureError(error, info);
}
