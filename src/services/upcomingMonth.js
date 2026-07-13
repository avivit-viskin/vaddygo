import { getEvents, parseEventDate } from "./eventsService";
import { getStaff, nextBirthday } from "./staffService";
import { upcomingHolidays } from "./upcomingHoliday";

/*
  upcomingMonth — כל מה שמתקרב בחודש הקרוב (משימה 14), למסך המתנות:
  חגים, אירועים מלוח השנה וימי הולדת של הצוות — עד 30 יום קדימה, ממוין לפי קרבה.
*/
const WINDOW_DAYS = 30;

function daysUntil(date, today) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(date) - start) / 86400000);
}

export function whenText(days) {
  if (days <= 0) return "היום";
  if (days === 1) return "מחר";
  return `בעוד ${days} ימים`;
}

export async function loadUpcomingMonth(today = new Date()) {
  const [events, staff] = await Promise.all([
    getEvents().catch(() => []),
    getStaff().catch(() => []),
  ]);
  const items = [];

  upcomingHolidays(today)
    .filter((h) => h.daysUntil >= 0 && h.daysUntil <= WINDOW_DAYS)
    .forEach((h) =>
      items.push({
        id: `holiday-${h.key}`,
        icon: "🎉",
        label: h.name,
        daysUntil: h.daysUntil,
      })
    );

  (events || []).forEach((e) => {
    const d = daysUntil(parseEventDate(e.eventDate), today);
    if (d >= 0 && d <= WINDOW_DAYS) {
      items.push({ id: `event-${e.id}`, icon: "📅", label: e.name, daysUntil: d });
    }
  });

  (staff || []).forEach((m) => {
    const d = daysUntil(nextBirthday(m.birthDate, today), today);
    if (d >= 0 && d <= WINDOW_DAYS) {
      items.push({
        id: `bday-${m.id}`,
        icon: "🎂",
        label: `יום הולדת ל${m.fullName}`,
        daysUntil: d,
      });
    }
  });

  return items.sort((a, b) => a.daysUntil - b.daysUntil);
}
