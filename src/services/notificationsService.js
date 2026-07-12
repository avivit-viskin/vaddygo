import { getEvents, parseEventDate } from "./eventsService";
import { getGifts } from "./giftsService";
import { getStudents } from "./studentsService";
import { getPaymentSummary } from "./paymentsService";
import { upcomingHolidays } from "./upcomingHoliday";

/*
  notificationsService — מרכז ההתראות של מסך הבית (הפעמון 🔔).
  מאחד למקום אחד את כל מה שכדאי שהוועד תשים לב אליו:
  - התראות מהשרת/דשבורד (תשלומים, ימי הולדת של הצוות) — עוברות כמו שהן.
  - חגים מתקרבים (עד שבוע לפני).
  - אירועים מלוח השנה עם תזכורת (עד שבוע לפני).
  - תזכורת מתנות: מתנות שטרם הושלמו לחג שמתקרב.
  - כמה הורים עוד לא שילמו.
  הכל מחושב בצד הלקוח מהנתונים הקיימים — לא תלוי בשינוי שרת.
*/

/* חלון "מתקרב" — שבוע לפני האירוע. */
export const SOON_DAYS = 7;

function daysUntil(date, today) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(date) - start) / 86400000);
}

function whenText(days) {
  if (days <= 0) return "היום";
  if (days === 1) return "מחר";
  return `בעוד ${days} ימים`;
}

/*
  buildNotifications — פונקציה טהורה (לבדיקה) הבונה רשימת התראות אחידה מכל
  המקורות שכבר נטענו. כל התראה: { id, type, message }.
*/
export function buildNotifications(
  { dashboard, events = [], gifts = [], unpaidCount = 0 },
  today = new Date()
) {
  const list = [];

  // 1. התראות מהשרת/דשבורד (תשלומים, ימי הולדת).
  // מזהה לפי תוכן (ולא לפי מיקום) כדי שסימון "נקרא" יישאר יציב.
  (dashboard?.alerts || []).forEach((alert) =>
    list.push({
      id: `alert:${alert.type}:${alert.message}`,
      type: alert.type,
      message: alert.message,
    })
  );

  // 2. חגים מתקרבים (עד שבוע)
  const soonHolidays = upcomingHolidays(today).filter(
    (h) => h.daysUntil <= SOON_DAYS
  );
  soonHolidays.forEach((h) =>
    list.push({
      id: `holiday-${h.key}`,
      type: "holiday",
      message: `${h.name} ${whenText(h.daysUntil)}`,
    })
  );

  // 3. אירועים מלוח השנה עם תזכורת (עד שבוע)
  (events || [])
    .map((e) => ({ ...e, days: daysUntil(parseEventDate(e.eventDate), today) }))
    .filter((e) => e.reminder && e.days >= 0 && e.days <= SOON_DAYS)
    .forEach((e) =>
      list.push({
        id: `event-${e.id}`,
        type: "event",
        message: `${e.name} ${whenText(e.days)}`,
      })
    );

  // 4. תזכורת מתנות: מתנות שטרם הושלמו לחג מתקרב
  const soonKeys = new Set(soonHolidays.map((h) => h.key));
  (gifts || [])
    .filter((g) => g.status !== "done" && soonKeys.has(g.holidayKey))
    .forEach((g) =>
      list.push({
        id: `gift-${g.id}`,
        type: "gift",
        message: `מתנה לסדר: ${g.name} (${g.holidayName})`,
      })
    );

  // 5. הורים שעוד לא שילמו. המזהה כולל את המספר — כשהמספר משתנה זו התראה
  // חדשה (מופיעה שוב), גם אם סימנת את הקודמת כנקראה.
  if (unpaidCount > 0) {
    list.push({
      id: `unpaid:${unpaidCount}`,
      type: "unpaid",
      message: `${unpaidCount} הורים עוד לא שילמו`,
    });
  }

  return list;
}

/* ── מצב "נקרא" (נשמר ב-localStorage) ─────────────────────── */

const READ_KEY = "vaadygo.readNotifications";

function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

/* מוסיף לכל התראה דגל read לפי מה שסומן כנקרא. */
export function applyReadState(notifications) {
  const readIds = getReadIds();
  return notifications.map((n) => ({ ...n, read: readIds.has(n.id) }));
}

export function markNotificationRead(id) {
  const ids = getReadIds();
  ids.add(id);
  saveReadIds(ids);
}

export function markAllNotificationsRead(idList) {
  const ids = getReadIds();
  idList.forEach((id) => ids.add(id));
  saveReadIds(ids);
}

/* סופר כמה תלמידים עדיין עם תשלום פתוח (לפי סיכום התשלומים לכל תלמיד). */
async function countUnpaidParents() {
  const students = await getStudents();
  if (!students || students.length === 0) {
    return 0;
  }
  const summaries = await Promise.all(
    students.map((s) => getPaymentSummary(s.id).catch(() => null))
  );
  return summaries.filter((s) => s && s.hasUnpaid).length;
}

/*
  loadNotifications — טוען את המקורות (אירועים, מתנות, תשלומים) ובונה את
  הרשימה המלאה. מקבל את הדשבורד שכבר נטען במסך הבית (לא טוען אותו שוב).
*/
export async function loadNotifications(dashboard, today = new Date()) {
  const [events, gifts, unpaidCount] = await Promise.all([
    getEvents().catch(() => []),
    getGifts().catch(() => []),
    countUnpaidParents().catch(() => 0),
  ]);
  return applyReadState(
    buildNotifications({ dashboard, events, gifts, unpaidCount }, today)
  );
}
