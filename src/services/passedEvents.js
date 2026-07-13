import { getEvents, parseEventDate } from "./eventsService";
import { getHolidayOccurrencesForMonth } from "../data/holidays";
import { holidayBudgetKey } from "./holidayBudgetsService";

/*
  passedEvents — אירועים וחגים שכבר עברו לאחרונה, לצורך הפופאפ "כמה כסף יצא?"
  (משימה 25). כל פריט שנשאל עליו נשמר כדי לא לשאול שוב. חלון של 21 יום אחורה
  כדי לא לשאול על אירועים ישנים מדי.
*/
const PROMPTED_KEY = "vaadygo.expensePrompted";
const LOOKBACK_DAYS = 21;

function getPromptedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(PROMPTED_KEY)) || []);
  } catch {
    return new Set();
  }
}

export function markExpensePrompted(id) {
  const ids = getPromptedIds();
  ids.add(id);
  localStorage.setItem(PROMPTED_KEY, JSON.stringify([...ids]));
}

/* מספר הימים בין שני תאריכים (b − a) */
function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

/* חגים שהסתיימו לאחרונה (בחודש הנוכחי או הקודם, עד LOOKBACK_DAYS יום) */
function recentlyPassedHolidays(startOfToday) {
  const items = [];
  const seen = new Set();
  for (const offset of [0, -1]) {
    const cursor = new Date(
      startOfToday.getFullYear(),
      startOfToday.getMonth() + offset,
      1
    );
    const year = cursor.getFullYear();
    const monthIndex = cursor.getMonth();
    for (const occ of getHolidayOccurrencesForMonth(year, monthIndex)) {
      const key = holidayBudgetKey(occ.name, occ.hebrewYear);
      if (seen.has(key)) continue;
      seen.add(key);
      const endDay = occ.days[occ.days.length - 1];
      const endDate = new Date(year, monthIndex, endDay);
      const daysAgo = daysBetween(endDate, startOfToday);
      if (daysAgo > 0 && daysAgo <= LOOKBACK_DAYS) {
        items.push({ id: `holiday:${key}`, name: occ.name, date: endDate });
      }
    }
  }
  return items;
}

/*
  מחזיר אירועים/חגים שעברו לאחרונה ושעוד לא נשאלנו עליהם — ממוין מהאחרון לישן.
*/
export async function loadPassedForExpense(today = new Date()) {
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const prompted = getPromptedIds();
  const items = [];

  const events = await getEvents().catch(() => []);
  for (const e of events || []) {
    const daysAgo = daysBetween(parseEventDate(e.eventDate), startOfToday);
    if (daysAgo > 0 && daysAgo <= LOOKBACK_DAYS) {
      items.push({ id: `event:${e.id}`, name: e.name, date: parseEventDate(e.eventDate) });
    }
  }

  items.push(...recentlyPassedHolidays(startOfToday));

  return items
    .filter((it) => !prompted.has(it.id))
    .sort((a, b) => b.date - a.date);
}
