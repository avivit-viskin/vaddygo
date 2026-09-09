/*
  pwaInstall — זיהוי סביבה להוספת VaddyGo למסך הבית ("אפליקציה" בלי חנות).
  משותף לבאנר ההצעה האוטומטי (AddToHomeScreen) ולכפתור הקבוע "הורידו את
  האפליקציה" בפוטר (InstallAppButton). מוגן מסביבות בלי window/matchMedia (טסטים).
*/

// כבר רץ כאפליקציה מותקנת (standalone) — אין מה להציע להתקין
export function isStandalone() {
  const standaloneDisplay =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return Boolean(standaloneDisplay || window.navigator.standalone);
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
}

export function isAndroid() {
  return /android/i.test(window.navigator.userAgent || "");
}

// ספארי "אמיתי" באייפון — רק בו יש "הוספה למסך הבית". בדפדפן-בתוך-אפליקציה
// (וואטסאפ/פייסבוק/אינסטגרם) או בכרום/פיירפוקס לאייפון צריך קודם לפתוח בספארי.
export function isIOSSafari() {
  const ua = window.navigator.userAgent || "";
  return (
    isIOS() &&
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter|Snapchat|Pinterest/i.test(
      ua
    )
  );
}

// כרום "אמיתי" (לא Edge/Opera/Samsung/פיירפוקס, ולא דפדפן-בתוך-אפליקציה).
// רק בכרום ההוספה למסך הבית עובדת חלק באנדרואיד; אחרת צריך קודם לפתוח בכרום.
export function isChrome() {
  const ua = window.navigator.userAgent || "";
  return (
    /Chrome/i.test(ua) &&
    !/wv|Edg|EdgA|OPR|OPT|SamsungBrowser|CriOS|FxiOS|Firefox|FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter|Snapchat|Pinterest|GSA/i.test(
      ua
    )
  );
}
