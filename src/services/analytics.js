/*
  analytics — תשתית מוכנה לחיבור עתידי של כלי מדידה (Google Analytics / פיקסל
  פייסבוק וכו'). עקרון-על: קוד מעקב נטען *אך ורק* אם המשתמש/ת אישרה עוגיות מדידה.
  כרגע אין ספק מעקב מחובר — כאן מוסיפים אותו בעתיד, והתשתית כבר מכבדת את הבחירה.

  לחיבור בעתיד: לשים את קוד הטעינה בתוך load() (למשל הזרקת gtag עם REACT_APP_GA_ID
  או fbq עם REACT_APP_FB_PIXEL_ID). מכיוון ש-load() נקרא רק דרך applyAnalyticsConsent(true),
  המעקב יופעל רק אחרי אישור — כפי שהחוק דורש.
*/
let loaded = false;

/*
  מפעיל/מכבה מעקב לפי בחירת העוגיות. מקבל boolean מבחוץ (בלי תלות מעגלית
  בשירות ההסכמה): נקרא מבאנר האישור, מההגדרות, ובעליית האפליקציה.
*/
export function applyAnalyticsConsent(consented) {
  if (consented) {
    load();
  } else {
    unload();
  }
}

function load() {
  if (loaded) {
    return;
  }
  loaded = true;
  // 📊 להוסיף כאן בעתיד את טעינת ספקי המעקב (רץ רק אחרי אישור):
  //   • Google Analytics — הזרקת gtag.js עם המזהה מ-REACT_APP_GA_ID
  //   • פיקסל פייסבוק — fbq('init', REACT_APP_FB_PIXEL_ID)
}

function unload() {
  // לא אישרו (או ביטלו) → לא טוענים מעקב. אם בעתיד המעקב טוען עוגיות, אפשר
  // להוסיף כאן ניקוי שלהן.
  loaded = false;
}
