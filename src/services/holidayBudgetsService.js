import { api } from "./api";
import { getOnboarding } from "./onboardingService";

/*
  holidayBudgetsService.js — תקציב לכל חג (כמה יוצא על מתנות בחנוכה וכו').
  המפתח: שם החג + השנה העברית (חנוכה תשפ"ז = מופע אחד גם בדצמבר וגם בינואר).

  נשמר בשרת ברמת הגן (`holidayBudgets`) כדי שכל חברות הוועד יראו את אותם
  תקציבים; נפילה מקומית (localStorage) כשאין גן מסונכרן או שהשרת לא זמין.
  הסכומים משמשים גם את מסך המתנות והעוזרת התקציבית (שלב 7).
*/
const STORAGE_KEY = "vaadygo.holidayBudgets";

export function holidayBudgetKey(name, hebrewYear) {
  return `${name}|${hebrewYear}`;
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeLocal(budgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

function currentGroupId() {
  try {
    return getOnboarding()?.groupId;
  } catch {
    return undefined;
  }
}

export async function getHolidayBudgets() {
  const groupId = currentGroupId();
  if (groupId) {
    try {
      const group = await api.get(`/api/groups/${groupId}`);
      const budgets = group.holidayBudgets || {};
      writeLocal(budgets); // מטמון מקומי
      return budgets;
    } catch {
      // השרת לא זמין — נשתמש במטמון המקומי
    }
  }
  return readLocal();
}

export async function setHolidayBudget(key, amount) {
  const budgets = { ...readLocal(), [key]: amount };
  writeLocal(budgets);
  const groupId = currentGroupId();
  if (groupId) {
    try {
      await api.put(`/api/groups/${groupId}/holiday-budgets`, budgets);
    } catch {
      // נשמר מקומית; יסונכרן לשרת בפעם הבאה שיהיה זמין
    }
  }
  return budgets;
}
