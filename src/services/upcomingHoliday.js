import { getHolidayOccurrencesForMonth } from "../data/holidays";
import { holidayBudgetKey } from "./holidayBudgetsService";

/*
  upcomingHoliday — מוצא את החגים הקרובים לצורך הספירה לאחור ובחירת "אירוע"
  למתנה (מסך המתנות, UI_SPEC ס' 12). לא ממציא תאריכים: משתמש בחישוב החגים
  הקיים (holidays.js) שנשען על לוח השנה העברי המובנה בדפדפן.

  מזהה כל מופע = שם החג + השנה העברית (holidayBudgetKey) — זהה למזהה של
  תקציב חג, כדי שהמתנות, התקציבים ומסך לוח השנה ידברו באותה שפה.
*/
export function upcomingHolidays(today = new Date(), monthsAhead = 14) {
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const earliestByKey = new Map();

  for (let offset = 0; offset < monthsAhead; offset++) {
    const cursor = new Date(
      startOfToday.getFullYear(),
      startOfToday.getMonth() + offset,
      1
    );
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();

    for (const occurrence of getHolidayOccurrencesForMonth(year, monthIndex)) {
      const key = holidayBudgetKey(occurrence.name, occurrence.hebrewYear);
      const date = new Date(year, monthIndex, occurrence.days[0]);
      const existing = earliestByKey.get(key);
      // מופע שנפרס על שני חודשים מופיע פעמיים — שומרים את יום ההתחלה האמיתי
      if (!existing || date < existing.date) {
        earliestByKey.set(key, {
          key,
          name: occurrence.name,
          hebrewYear: occurrence.hebrewYear,
          date,
        });
      }
    }
  }

  return [...earliestByKey.values()]
    .filter((holiday) => holiday.date >= startOfToday)
    .map((holiday) => ({
      ...holiday,
      daysUntil: Math.round((holiday.date - startOfToday) / 86400000),
    }))
    .sort((a, b) => a.date - b.date);
}

export function nextHoliday(today = new Date()) {
  return upcomingHolidays(today)[0] || null;
}
