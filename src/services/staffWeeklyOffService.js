import { getOnboarding } from "./onboardingService";

/*
  staffWeeklyOffService — "ימי חופש קבועים של הצוות" לפי יום בשבוע.

  בקשת בעלת המוצר: לא תאריך בודד אלא יום קבוע — למשל בימי ראשון הגננת בחופש,
  בימי שני הסייעת. כל רשומה = איש צוות + יום בשבוע (0=ראשון … 6=שבת).

  נשמר מקומית (localStorage) ומופרד לפי הגן הפעיל, כדי שגנים שונים לא יתערבבו.
  ⏳ מיועד להסתנכרן לשרת ברמת-הגן כשאזור ה-backend יתפנה, כך שכל חברות הוועד
  יראו את אותו לוח (כמו תקציבי החגים).
*/
const STORAGE_KEY = "vaadygo.staffWeeklyOff";

export const WEEKDAYS = [
  { value: 0, label: "ראשון" },
  { value: 1, label: "שני" },
  { value: 2, label: "שלישי" },
  { value: 3, label: "רביעי" },
  { value: 4, label: "חמישי" },
  { value: 5, label: "שישי" },
  { value: 6, label: "שבת" },
];

export function weekdayLabel(weekday) {
  const day = WEEKDAYS.find((w) => w.value === Number(weekday));
  return day ? day.label : "";
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

// מפתח הגן הפעיל — כדי להפריד בין מוסדות שונים של אותה משתמשת
function currentGroupKey() {
  try {
    return String(getOnboarding()?.groupId ?? "local");
  } catch {
    return "local";
  }
}

export function getStaffWeeklyOff() {
  const list = readAll()[currentGroupKey()];
  return Array.isArray(list) ? list : [];
}

export function addStaffWeeklyOff({ staffName, weekday }) {
  const key = currentGroupKey();
  const map = readAll();
  const list = Array.isArray(map[key]) ? map[key] : [];
  // מזהה יציב בלי תלות ב-Date.now (למניעת התנגשות): המקסימום הקיים + 1
  const nextId = list.reduce((max, e) => Math.max(max, e.id || 0), 0) + 1;
  const entry = {
    id: nextId,
    staffName: (staffName || "").trim(),
    weekday: Number(weekday),
  };
  map[key] = [...list, entry];
  writeAll(map);
  return entry;
}

export function removeStaffWeeklyOff(id) {
  const key = currentGroupKey();
  const map = readAll();
  const list = Array.isArray(map[key]) ? map[key] : [];
  map[key] = list.filter((e) => e.id !== id);
  writeAll(map);
}
