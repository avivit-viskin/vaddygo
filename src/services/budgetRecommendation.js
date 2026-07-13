import { getOnboarding } from "./onboardingService";

/*
  budgetRecommendation — עוזרת התקציב (משימה 22): חלוקת תקציב מומלצת ל-5
  קטגוריות לפי מספר הילדים והצוות. הסכומים ל"יחידה" ניתנים לעריכה ונשמרים
  מקומית; החגים נלקחים מהתקציבים שכבר הוגדרו בלוח השנה (מתעדכן איתם).
*/
const RATES_KEY = "vaadygo.budgetRates";
const DEFAULT_RATES = {
  staffPerPerson: 50, // ₪ לאיש צוות
  childBirthday: 20, // ₪ ליום הולדת ילד
  endOfYearPerChild: 40, // ₪ מתנת סוף שנה לילד
  miscPercent: 10, // % רזרבה לבלת"מ
};

export function getBudgetRates() {
  try {
    return { ...DEFAULT_RATES, ...(JSON.parse(localStorage.getItem(RATES_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_RATES };
  }
}

export function setBudgetRate(key, value) {
  const next = { ...getBudgetRates(), [key]: Number(value) || 0 };
  localStorage.setItem(RATES_KEY, JSON.stringify(next));
  return next;
}

export function computeBudgetRecommendation(holidayBudgets = {}, rates = getBudgetRates()) {
  const onboarding = getOnboarding() || {};
  const children = Number(onboarding.childrenCount) || 0;
  const staff = Number(onboarding.staffCount) || 0;

  const holidays = Object.values(holidayBudgets).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );
  const staffBdays = staff * rates.staffPerPerson;
  const childBdays = children * rates.childBirthday;
  const endOfYear = children * rates.endOfYearPerChild;
  const subtotal = holidays + staffBdays + childBdays + endOfYear;
  const misc = Math.round(subtotal * (rates.miscPercent / 100));

  const rows = [
    { key: "holidays", name: "חגים", amount: holidays, note: "מהתקציבים שהגדרת בלוח השנה" },
    { key: "staff", name: "ימי הולדת צוות", amount: staffBdays, note: `${staff} × ${rates.staffPerPerson}₪` },
    { key: "children", name: "ימי הולדת ילדים", amount: childBdays, note: `${children} × ${rates.childBirthday}₪` },
    { key: "endOfYear", name: "מתנות סוף שנה", amount: endOfYear, note: `${children} × ${rates.endOfYearPerChild}₪` },
    { key: "misc", name: 'בלת"מ (רזרבה)', amount: misc, note: `${rates.miscPercent}% רזרבה` },
  ];

  return { rows, total: subtotal + misc, children, staff };
}
