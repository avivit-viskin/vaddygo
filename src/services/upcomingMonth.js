import { getStaff, nextBirthday } from "./staffService";
import { getStudents } from "./studentsService";
import { upcomingHolidays } from "./upcomingHoliday";

/*
  upcomingMonth — התזכורות במסך המתנות. לפי בקשת בעלת המוצר מוצגים *רק*:
  • חגים — עד שבועיים לפני החג.
  • ימי הולדת של הצוות ושל הילדים — עד שבוע לפני.
  ממוין לפי קרבה. (אירועים כלליים מלוח השנה אינם מוצגים כאן — זה מסך מתנות.)
*/
const HOLIDAY_WINDOW_DAYS = 14; // שבועיים לפני החג
const BIRTHDAY_WINDOW_DAYS = 7; // שבוע לפני יום הולדת

function daysUntil(date, today) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(date) - start) / 86400000);
}

export function whenText(days) {
  if (days <= 0) return "היום";
  if (days === 1) return "מחר";
  return `בעוד ${days} ימים`;
}

/* יום הולדת בתוך חלון השבוע → פריט תזכורת, אחרת null */
function birthdayItem(id, fullName, birthDate, today) {
  if (!birthDate || !fullName) return null;
  const d = daysUntil(nextBirthday(birthDate, today), today);
  if (d < 0 || d > BIRTHDAY_WINDOW_DAYS) return null;
  return { id, icon: "🎂", label: `יום הולדת ל${fullName}`, daysUntil: d };
}

export async function loadUpcomingMonth(today = new Date()) {
  const [staff, students] = await Promise.all([
    getStaff().catch(() => []),
    getStudents().catch(() => []),
  ]);
  const items = [];

  // חגים — עד שבועיים לפני
  upcomingHolidays(today)
    .filter((h) => h.daysUntil >= 0 && h.daysUntil <= HOLIDAY_WINDOW_DAYS)
    .forEach((h) =>
      items.push({
        id: `holiday-${h.key}`,
        icon: "🎉",
        label: h.name,
        daysUntil: h.daysUntil,
      })
    );

  // ימי הולדת של הצוות ושל הילדים — עד שבוע לפני
  (staff || []).forEach((m) => {
    const item = birthdayItem(`bday-staff-${m.id}`, m.fullName, m.birthDate, today);
    if (item) items.push(item);
  });
  (students || []).forEach((s) => {
    const fullName = `${s.firstName || ""} ${s.lastName || ""}`.trim();
    const item = birthdayItem(`bday-student-${s.id}`, fullName, s.birthDate, today);
    if (item) items.push(item);
  });

  return items.sort((a, b) => a.daysUntil - b.daysUntil);
}
