/*
  reminderSchedule — הלוגיקה של "תזכורות אוטומטיות" (פיצ'ר פרו).
  וואטסאפ לא מאפשר שליחה מהשרת, אז ה"אוטומציה" היא בתזמון ובמעקב: המערכת זוכרת
  מתי תוזכר כל הורה, ולפי מרווח שנבחר (ברירת מחדל 7 ימים) מחשבת מי "מחכה לתזכורת
  עכשיו" — והמשתמשת רק לוחצת שליחה. הלוג נשמר מקומית (localStorage) ושורד רענון.
*/
const LOG_KEY = "vaadygo.reminderLog"; // { [studentId]: lastRemindedISO }
const CADENCE_KEY = "vaadygo.reminderCadenceDays";
const DEFAULT_CADENCE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getCadenceDays() {
  const value = Number(localStorage.getItem(CADENCE_KEY));
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CADENCE_DAYS;
}

export function setCadenceDays(days) {
  const value = Number(days);
  if (Number.isFinite(value) && value > 0) {
    localStorage.setItem(CADENCE_KEY, String(value));
  }
}

function readLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || {};
  } catch {
    return {};
  }
}

export function getLastReminded(studentId) {
  return readLog()[studentId] || null;
}

/* מסמן שהורה תוזכר עכשיו — מאפס את הספירה עד לתזכורת הבאה. */
export function markReminded(studentId, now = new Date()) {
  const log = readLog();
  log[studentId] = now.toISOString();
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch {
    // אחסון חסום — לא קריטי, פשוט לא נזכור בין רענונים
  }
}

/* כמה ימים עברו מאז התזכורת האחרונה. null = מעולם לא תוזכר. */
export function daysSinceReminded(studentId, now = new Date()) {
  const last = getLastReminded(studentId);
  if (!last) {
    return null;
  }
  return Math.floor((now.getTime() - new Date(last).getTime()) / DAY_MS);
}

/* האם ההורה "מחכה לתזכורת": מעולם לא תוזכר, או שעבר מרווח התזמון מאז האחרונה. */
export function isDue(studentId, cadenceDays = getCadenceDays(), now = new Date()) {
  const since = daysSinceReminded(studentId, now);
  return since === null || since >= cadenceDays;
}
