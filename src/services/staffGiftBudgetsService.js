/*
  staffGiftBudgetsService.js — התקציב המומלץ למתנה לכל איש/אשת צוות (ליום ההולדת).
  מפתח לפי מזהה איש הצוות.

  ⏳ זמני: נשמר ב-localStorage עד שייבנה API בשרת (כמו תקציבי החגים,
  ראו holidayBudgetsService). הפונקציות אסינכרוניות בכוונה — ההחלפה ל-API
  תהיה בגוף הפונקציות בלבד, בלי לגעת במסכים.
*/
const STORAGE_KEY = "vaadygo.staffGiftBudgets";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export async function getStaffGiftBudgets() {
  return readAll();
}

export async function setStaffGiftBudget(staffId, amount) {
  const budgets = readAll();
  budgets[staffId] = amount;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  return budgets;
}
