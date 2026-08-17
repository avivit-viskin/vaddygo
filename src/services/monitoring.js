import * as Sentry from "@sentry/react";

/*
  monitoring — מעקב שגיאות בזמן אמת (Sentry). מופעל רק אם מוגדר
  REACT_APP_SENTRY_DSN בסביבה; בלי מפתח הניטור כבוי לגמרי.

  ⚠️ פרטיות — למה יש כאן ניקוי ולא רק אתחול:
  Sentry שולח עם כל תקלה את **כתובת הדף** שבה היא קרתה. בכתובות של VaddyGo
  יש סודות אמיתיים: `/supplier/<טוקן>` הוא קישור העריכה של ספק,
  `/join/<טוקן>` הוא הזמנה לגן, ו-`/poll/<טוקן>` הוא סקר. שליחת הכתובת כמו
  שהיא הייתה מעבירה את הסודות האלה לצד שלישי — ומי שרואה אותם בלוח הבקרה של
  Sentry יכול להשתמש בהם.

  לכן כל אירוע עובר ניקוי לפני השליחה: הטוקנים מוחלפים ב-<redacted>, וגם
  ה-breadcrumbs (שובל הפעולות שקדמו לתקלה) עוברים את אותו ניקוי.
  בנוסף sendDefaultPii=false — לא נשלחים פרטי משתמש או כתובת IP.
*/
let enabled = false;

/* נתיבים שבהם החלק שאחרי הקידומת הוא סוד. */
const SECRET_PATHS = ["/supplier/", "/join/", "/poll/"];

/*
  redactUrl — מסתיר טוקנים בכתובת. `/supplier/abc123` → `/supplier/<redacted>`.
  מחזיר את הקלט כמו שהוא אם אינו מחרוזת (לא מפילים דיווח תקלה בגלל ניקוי).
*/
export function redactUrl(url) {
  if (typeof url !== "string" || url.length === 0) {
    return url;
  }
  let clean = url;
  for (const prefix of SECRET_PATHS) {
    // כל מה שאחרי הקידומת ועד הסימן הבא (/ ? #) הוא הטוקן
    const pattern = new RegExp(`(${prefix})[^/?#]+`, "g");
    clean = clean.replace(pattern, `$1<redacted>`);
  }
  return clean;
}

export function initMonitoring() {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) {
    return; // אין מפתח — הניטור נשאר כבוי
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0, // מתמקדים בתקלות בלבד, בלי דגימת ביצועים
    // לא לשלוח פרטי משתמש/כתובת IP — אין בהם צורך כדי לתקן תקלה
    sendDefaultPii: false,
    /*
      ניקוי אחרון לפני השליחה. חשוב שיהיה כאן ולא בקריאה — כך שום מסלול
      דיווח (כולל תקלות שנתפסות אוטומטית ע"י Sentry) לא עוקף אותו.
    */
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = redactUrl(event.request.url);
      }
      if (Array.isArray(event.breadcrumbs)) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
          ...crumb,
          data: crumb.data
            ? { ...crumb.data, url: redactUrl(crumb.data.url) }
            : crumb.data,
        }));
      }
      return event;
    },
    beforeBreadcrumb(crumb) {
      // לוגים של הדפדפן עלולים להכיל נתונים שהודפסו בטעות — לא שולחים אותם
      if (crumb.category === "console") {
        return null;
      }
      if (crumb.data?.url) {
        return { ...crumb, data: { ...crumb.data, url: redactUrl(crumb.data.url) } };
      }
      return crumb;
    },
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
