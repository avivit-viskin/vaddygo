import { getActiveInstitution } from "./institutionsService";

/*
  plan.js — הבחנת חינם ↔ פרו.

  ליבת הוועד חינם, ומעליה מסלול פרו (₪149/שנה) של אוטומציות, עוזרת AI, כלים
  מתקדמים וניהול בקנה מידה גדול.

  ✅ האכיפה מופעלת (PRO_ENFORCED=true): פיצ'רי/עמודי פרו חסומים למי שאינה מנויה,
  ומפנים אותה לעמוד השדרוג. פתיחת פרו (למנהלת, עד חיבור סליקה אמיתית): מזינים את
  קוד הפתיחה במקום מספר כרטיס במסך התשלום → grantProLocally פותח פרו **לגן הפעיל**.

  💡 פרו הוא לכל גן (מוסד) בנפרד: פתיחה בגן אחד לא מדליקה פרו בגן אחר. לכן
  isPro() נבדק תמיד מול הגן הפעיל (getActiveInstitution), ולא כדגל גלובלי למכשיר.
*/

// מחיר המנוי השנתי לפרו (תואם למסמך התמחור; ניתן לשינוי)
export const PRO_PRICE = 149;

// מתג-אב לאכיפת פרו. true → פיצ'רי פרו נחסמים למי שאינה מנויה.
export const PRO_ENFORCED = true;

// קוד פתיחת פרו (מוזן במקום מספר כרטיס במסך התשלום) — שלב ביניים עד סליקה אמיתית.
export const PRO_UNLOCK_CODE = "1234";

// פיצ'רי הפרו שאושרו (מפתח → תווית עברית להצגה בעמוד השדרוג ובכל מקום אחר)
export const PRO_FEATURES = {
  ai: "עוזרת AI מלאה",
  multiInstitution: "ניהול כמה מוסדות בחשבון אחד",
  teamRoles: "תפקידי צוות והרשאות (מנהל/עורך/צופה)",
  bulkReminders: "תזכורת ובקשת תשלום גורפת לכל החייבים",
  budgetAssistant: "עוזרת תקציב חכמה (חגים ↔ מתנות)",
  receipts: "ניהול קבלות בצילום",
  reports: "דוחות, ייצוא ל-Excel והיסטוריה רב-שנתית",
  prioritySupport: "תמיכה מועדפת",
  // כלים ייעודיים (עמודים) שגם הם פרו
  reminders: "תזכורות אוטומטיות",
  polls: "סקרים והצבעות",
  backup: "גיבוי והשוואת שנים",
  branding: "מיתוג אישי לגן",
  contacts: "ספר קשרים ושליחה מרוכזת",
};

// מיפוי נתיב → מפתח פיצ'ר פרו, לחסימת עמודי פרו מרוכזת (ב-App).
export const PRO_ROUTES = {
  "/assistant": "ai",
  "/annual-report": "reports",
  "/reminders": "reminders",
  "/polls": "polls",
  "/backup": "backup",
  "/branding": "branding",
  "/contacts": "contacts",
};

// פתיחת-פרו מקומית — לפי גן (מוסד), לא גלובלית: שומרים רשימת מזהי-גנים שנפתחו,
// כדי שפתיחה בגן אחד לא תדליק פרו בגן אחר. בתוך namespace של vaadygo.* — ולכן
// נמחק אוטומטית כשמשתמש *אחר* מתחבר במכשיר (clearCachedAppData), אבל נשמר בכניסה
// חוזרת של אותו משתמש (כי plan מהשרת עדיין ריק). כך הפתיחה ב-1234 לא "נעלמת".
const PRO_UNLOCK_KEY = "vaadygo.proUnlock";

// מזהה יציב לגן הפעיל — מזהה ה-Group בשרת אם קיים, אחרת המזהה המקומי.
function currentGanKey() {
  const active = getActiveInstitution();
  const key = active?.serverGroupId ?? active?.id;
  return key != null ? String(key) : "default";
}

// קורא את קבוצת מזהי-הגנים שנפתחו. מהגר פורמט ישן ("1" = פתיחה גלובלית) לפתיחת
// הגן הפעיל בלבד — כדי שהמעבר למודל לפי-גן לא ייקח פרו ממי שכבר פתח בעבר.
function readUnlockedSet() {
  let raw;
  try {
    raw = localStorage.getItem(PRO_UNLOCK_KEY);
  } catch {
    return new Set();
  }
  if (!raw) {
    return new Set();
  }
  if (raw === "1") {
    const migrated = new Set([currentGanKey()]);
    writeUnlockedSet(migrated);
    return migrated;
  }
  try {
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeUnlockedSet(set) {
  try {
    localStorage.setItem(PRO_UNLOCK_KEY, JSON.stringify([...set]));
  } catch {
    // אין localStorage — הפתיחה פשוט לא תישמר במכשיר
  }
}

/* האם לגן הפעיל יש מנוי פרו. ברירת מחדל: לא (חינם). לפי גן — לא גלובלי. */
export function isPro() {
  return readUnlockedSet().has(currentGanKey());
}

/* האם המפתח שייך לפיצ'רי הפרו */
export function isProFeature(key) {
  return Object.prototype.hasOwnProperty.call(PRO_FEATURES, key);
}

/*
  האם פיצ'ר חסום עבור המשתמשת כרגע. חסום רק אם ההבחנה מופעלת (PRO_ENFORCED),
  זהו פיצ'ר פרו, והמשתמשת אינה מנויה.
*/
export function isFeatureLocked(key) {
  return PRO_ENFORCED && isProFeature(key) && !isPro();
}

/* האם הנתיב הנוכחי הוא עמוד פרו חסום (למשתמשת שאינה מנויה). */
export function isRouteLocked(pathname) {
  const key = PRO_ROUTES[pathname];
  return key ? isFeatureLocked(key) : false;
}

/* פתיחת פרו מקומית — מסמן את **הגן הפעיל בלבד** כמנוי (נשמר גם בין כניסות). */
export function grantProLocally() {
  const set = readUnlockedSet();
  set.add(currentGanKey());
  writeUnlockedSet(set);
}

/* ביטול פתיחת פרו מקומית לגן הפעיל (למשל לבדיקת המצב הנעול). */
export function revokeProLocally() {
  const set = readUnlockedSet();
  set.delete(currentGanKey());
  writeUnlockedSet(set);
}
