/*
  holidayBudgetsService.js — תקציב לכל חג (למשל: כמה יוצא על מתנות בחנוכה).
  המפתח של כל תקציב: שם החג + השנה העברית — כך חנוכה תשפ"ז הוא מופע אחד
  גם כשרואים אותו בדצמבר וגם בינואר.

  ⏳ זמני: נשמר ב-localStorage עד שייבנה API לתקציבים בשרת (מודל Budget קיים).
  הפונקציות אסינכרוניות בכוונה — ההחלפה ל-API תהיה בגוף הפונקציות בלבד.
  הסכומים ישמשו גם את מסך המתנות והעוזרת התקציבית (שלב 7).
*/

const STORAGE_KEY = "vaadygo.holidayBudgets";

export function holidayBudgetKey(name, hebrewYear) {
  return `${name}|${hebrewYear}`;
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export async function getHolidayBudgets() {
  return readAll();
}

export async function setHolidayBudget(key, amount) {
  const budgets = readAll();
  budgets[key] = amount;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  return budgets;
}
