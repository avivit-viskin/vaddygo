/*
  aiPrefs — העדפת פרטיות: האם לאפשר לעוזרת ה-AI לראות את המצב הכספי (יתרה,
  גבייה והוצאות). המידע (סכומים בלבד, ללא שמות/טלפונים) נשלח ל-Google. ברירת
  המחדל דלוקה (הפיצ'ר שביקשה בעלת המוצר), אך אפשר לכבות למזעור מידע.
*/
const KEY = "vaadygo.aiFinanceEnabled";

export function isAiFinanceEnabled() {
  try {
    return localStorage.getItem(KEY) !== "false";
  } catch {
    return true;
  }
}

export function setAiFinanceEnabled(enabled) {
  try {
    localStorage.setItem(KEY, enabled ? "true" : "false");
  } catch {
    // storage חסום — לא קריטי
  }
  return enabled;
}
