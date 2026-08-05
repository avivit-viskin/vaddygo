import { currentSchoolYear, currentHebrewYearName } from "./schoolYear";

/*
  yearlyArchive — גיבוי והשוואה בין שנים (פיצ'ר פרו).
  • גיבוי מלא: אוסף את כל נתוני האפליקציה (מפתחות vaadygo.*) לקובץ JSON להורדה,
    כדי שהמידע יהיה שמור וניתן להעברה כשמתחלף ועד.
  • סיכום שנה (snapshot): שומר את תמצית השנה הנוכחית (נגבה/הוצאות/יתרה/ילדים)
    בארכיון מקומי; מסך ההשוואה מציג את כל השנים ששמרנו זו לצד זו.
*/
const ARCHIVE_KEY = "vaadygo.yearlyArchive";

function read() {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_KEY)) || [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list));
  } catch {
    // אחסון חסום — לא קריטי
  }
}

/* כל סיכומי השנים ששמרנו, ממוינים משנה מוקדמת לאחרונה. */
export function getSnapshots() {
  return read().sort((a, b) => a.year - b.year);
}

/* שומר (או מעדכן) את סיכום השנה הנוכחית מתוך נתוני מסך הבית. */
export function saveSnapshot(dashboard, now = new Date()) {
  if (!dashboard) {
    return null;
  }
  const spent = (dashboard.byCategory || []).reduce(
    (sum, c) => sum + (c.spentAmount || 0),
    0
  );
  const snapshot = {
    year: dashboard.year || currentSchoolYear(),
    yearName: currentHebrewYearName(),
    ganName: dashboard.ganName || "",
    collected: dashboard.collectedTotal || 0,
    spent,
    balance: dashboard.boxBalance || 0,
    children: dashboard.childrenCount || 0,
    savedAt: now.toISOString(),
  };
  // שנה שכבר נשמרה — מוחלפת בערך המעודכן (לא כפילות)
  const list = read().filter((s) => s.year !== snapshot.year);
  list.push(snapshot);
  write(list);
  return snapshot;
}

export function deleteSnapshot(year) {
  write(read().filter((s) => s.year !== year));
}

/* אוסף את כל נתוני האפליקציה לאובייקט גיבוי אחד (בלי טוקן/פרטי הזדהות). */
export function buildBackup(now = new Date()) {
  const data = {};
  const skip = new Set(["vaadygo.token", "vaadygo.user"]);
  Object.keys(localStorage)
    .filter((k) => k.startsWith("vaadygo.") && !skip.has(k))
    .forEach((k) => {
      data[k] = localStorage.getItem(k);
    });
  return { app: "VaddyGo", exportedAt: now.toISOString(), data };
}
