/*
  format — עזרי תצוגה משותפים לכל המסכים.
*/

/* 37400 ← "37,400 ₪" */
export function formatShekels(amount) {
  return `${Number(amount || 0).toLocaleString("he-IL")} ₪`;
}

/* "2026-07-12..." ← "12.7" (יום.חודש בעברית) */
export function formatDayMonth(isoDate) {
  return new Date(isoDate).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "numeric",
  });
}
