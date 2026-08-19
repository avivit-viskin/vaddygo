/*
  tourPreload — טוען מראש את חבילות הקוד (chunks) של המסכים שהסיור עובר בהם,
  כדי שהמעבר בין שלב לשלב יהיה מיידי בלי ספינר טעינה.

  הנתיבים חייבים להיות זהים ל-lazy שב-App.js (`./pages/...`), כך ש-webpack
  מזהה שזו אותה חבילה — הטעינה המוקדמת ממלאת את המטמון, והניווט בפועל מיידי.
*/
export function preloadTourPages() {
  const chunks = [
    () => import("../pages/StudentsPage"),
    () => import("../pages/CalendarPage"),
    () => import("../pages/GiftsPage"),
    () => import("../pages/CollectionSettingsPage"),
    () => import("../pages/SettingsPage"),
    () => import("../pages/UpgradePage"),
  ];
  chunks.forEach((load) => {
    // כשל טעינה מוקדמת אינו קריטי — הניווט הרגיל ינסה שוב
    load().catch(() => {});
  });
}
