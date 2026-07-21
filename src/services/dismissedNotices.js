/*
  dismissedNotices — התראות שהמשתמשת בחרה להסתיר (בלחיצת X). נשמר מקומית במכשיר
  כדי שלא יופיעו שוב. כל התראה מזוהה במפתח ייחודי; כשמגיעה התראה *חדשה* (מפתח אחר,
  למשל החג הבא) — היא כן תופיע. כך "הסתרה" מסתירה בדיוק את מה שלא רוצים לראות.
*/
const KEY = "vaadygo.dismissedNotices";

function getSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) || []);
  } catch {
    return new Set();
  }
}

export function isDismissed(id) {
  return getSet().has(id);
}

export function dismissNotice(id) {
  const set = getSet();
  set.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    // אחסון חסום — לא קריטי
  }
}
