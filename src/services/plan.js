import { getActiveInstitution } from "./institutionsService";
import { isSuperAdmin } from "./authService";

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

/*
  מי רשאי לפתוח פרו בלי תשלום — **מנהלת VaddyGo בלבד**.

  למה זה קריטי: הקוד למעלה נארז לתוך קובץ ה-JavaScript הציבורי של האתר, כלומר
  כל אחד יכול למצוא אותו. בלי השער הזה, כל לקוחה שנתקלת בקוד יכולה לפתוח לעצמה
  את מסלול הפרו בחינם — ערוץ ההכנסה של VaddyGo נסגר בשקט.

  ⚠️ מגבלה שחשוב להכיר: זו בדיקה בצד הלקוח בלבד, ולכן היא מרתיעה ולא חוסמת
  לחלוטין. פרו עדיין אינו נאכף בשרת (ראו ROADMAP) — האכיפה האמיתית תגיע יחד עם
  הסליקה, כששדה ה-plan יגיע מהשרת. עד אז זהו הרף הסביר.
*/
export function canUnlockProWithoutPaying() {
  return isSuperAdmin();
}

// פיצ'רי הפרו שאושרו (מפתח → תווית עברית להצגה בעמוד השדרוג ובכל מקום אחר)
export const PRO_FEATURES = {
  ai: "עוזרת AI מלאה",
  teamRoles: "תפקידי צוות והרשאות (מנהל/עורך/צופה)",
  bulkReminders: "תזכורת ובקשת תשלום גורפת לכל החייבים",
  budgetAssistant: "עוזרת תקציב חכמה (חגים ↔ מתנות)",
  receipts: "ניהול קבלות בצילום",
  reports: "דוחות, ייצוא ל-Excel והיסטוריה רב-שנתית",
  prioritySupport: "תמיכה מועדפת",
  // הוספת מוסד נוסף (גן/בית ספר) — החלטת בעלת המוצר (10.08.2026): פיצ'ר פרו.
  // ניהול ומעבר בין מוסדות *קיימים* נשאר חינם; רק ההוספה דורשת מנוי.
  multiInstitution: "ניהול כמה מוסדות (הוספת גן/בית ספר נוסף)",
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

/*
  האם לגן הפעיל יש מנוי פרו.

  **מקור האמת הוא השרת** (‏`Group.IsPro`, מגיע דרך סנכרון המוסדות): שם הדגל
  נקבע ושם הוא נאכף בפועל — פיצ'רי פרו מוחזרים ב-402 למוסד שאינו מנוי, גם אם
  הלקוח יטען אחרת. הבדיקה כאן היא רק כדי שהממשק יציג את המצב הנכון.

  הפתיחה המקומית נשארת כרשת-ביטחון בלבד: מוסד שעדיין לא סונכרן מהשרת (נוצר
  אופליין, או שהשרת לא היה זמין) לא ייחסם בממשק סתם בגלל חוסר נתונים.
*/
export function isPro() {
  const active = getActiveInstitution();
  if (active?.isPro) {
    return true;
  }
  return readUnlockedSet().has(currentGanKey());
}

/*
  האם למוסד מסוים (לא בהכרח הפעיל) יש פרו — לפי אותו מפתח-גן ואותה קבוצת-פתיחה
  שמשמשים את isPro(). משמש להצגת "כתר שדרוג" ליד כל מוסד שאינו פרו (והסתרתו
  ברגע שהמוסד משדרג).
*/
export function isProInstitution(institution) {
  if (!institution) {
    return false;
  }
  // קודם האמת מהשרת, ורק אחריה הפתיחה המקומית (ראו isPro)
  if (institution.isPro) {
    return true;
  }
  const key =
    institution.serverGroupId != null
      ? String(institution.serverGroupId)
      : institution.id != null
        ? String(institution.id)
        : "default";
  return readUnlockedSet().has(key);
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
