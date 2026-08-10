/*
  format — עזרי תצוגה משותפים לכל המסכים.
*/

/* 37400 ← "37,400 ₪" */
export function formatShekels(amount) {
  return `${Number(amount || 0).toLocaleString("he-IL")} ₪`;
}

/* 37400 ← "37,400" (מספר בלבד, בלי ₪ — למשל "X מתוך Y ₪" כשה-₪ אחד לצמד) */
export function formatNumber(amount) {
  return Number(amount || 0).toLocaleString("he-IL");
}

/* "2026-07-12..." ← "12.7" (יום.חודש בעברית) */
export function formatDayMonth(isoDate) {
  return new Date(isoDate).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "numeric",
  });
}

/*
  formatUnit — יחידת המידה של המוצר לתצוגה ליד המחיר. אם הספק כתב רק מספר
  (כמות) — מוסיפים אוטומטית "יח'": "10" → "10 יח'". טקסט אחר (מארז / ק"ג /
  "10 יח'") מוצג כמו שהוא. ריק → "".
*/
export function formatUnit(unit) {
  const u = (unit || "").trim();
  if (!u) return "";
  return /^\d+(\.\d+)?$/.test(u) ? `${u} יח'` : u;
}

/* "2023-05-08" ← "8.5.2023" (תאריך מלא; פירוק ידני כדי לא להיות תלוי באזור זמן) */
export function formatBirthday(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${Number(day)}.${Number(month)}.${year}`;
}
