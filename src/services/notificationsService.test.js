import {
  buildNotifications,
  applyReadState,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notificationsService";
import { upcomingHolidays } from "./upcomingHoliday";

/*
  buildNotifications — מאחד את כל סוגי ההתראות. ממקמים את החגים דרך מוק
  כדי שהבדיקה תהיה יציבה (לא תלויה בתאריך אמיתי).
*/
jest.mock("./upcomingHoliday");

afterEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

test("מאחד את כל סוגי ההתראות (שרת, חג, אירוע, מתנה, לא-שילמו)", () => {
  upcomingHolidays.mockReturnValue([
    { key: "חנוכה|5787", name: "חנוכה", date: new Date(2026, 11, 6), daysUntil: 5 },
  ]);
  const today = new Date(2026, 11, 1);

  const dashboard = {
    alerts: [{ type: "payments", message: "הגבייה עוד לא התחילה" }],
  };
  const events = [
    { id: 9, name: "מסיבת חנוכה", eventDate: "2026-12-05", reminder: true },
    { id: 10, name: "טיול שנתי", eventDate: "2027-06-01", reminder: true },
  ];
  const gifts = [
    { id: 1, name: "מתנה לגננת", holidayKey: "חנוכה|5787", holidayName: "חנוכה", status: "planned" },
    { id: 2, name: "כבר קניתי", holidayKey: "חנוכה|5787", holidayName: "חנוכה", status: "done" },
  ];

  const list = buildNotifications({ dashboard, events, gifts, unpaidCount: 3 }, today);
  const types = list.map((n) => n.type);

  expect(types).toContain("payments"); // מהדשבורד
  expect(types).toContain("holiday"); // חנוכה בעוד 5 ימים
  expect(types).toContain("event"); // מסיבת חנוכה השבוע
  expect(types).toContain("gift"); // מתנה שטרם הושלמה
  expect(types).toContain("unpaid"); // 3 הורים

  // אירוע רחוק (מעבר לשבוע) לא נכנס
  expect(list.some((n) => n.message.includes("טיול שנתי"))).toBe(false);
  // מתנה שכבר נקנתה (done) לא נכנסת — רק אחת נשארה
  expect(list.filter((n) => n.type === "gift")).toHaveLength(1);
  // מזהים ייחודיים לכל התראה
  expect(new Set(list.map((n) => n.id)).size).toBe(list.length);
});

test("בלי מקורות — רק התראות השרת (אם יש), בלי לקרוס", () => {
  upcomingHolidays.mockReturnValue([]);
  const list = buildNotifications({ dashboard: null }, new Date());
  expect(list).toEqual([]);
});

test("אירוע בלי סימון תזכורת לא יוצר התראה", () => {
  upcomingHolidays.mockReturnValue([]);
  const today = new Date(2026, 11, 1);
  const events = [
    { id: 1, name: "אירוע בלי תזכורת", eventDate: "2026-12-03", reminder: false },
  ];
  const list = buildNotifications({ dashboard: null, events }, today);
  expect(list).toHaveLength(0);
});

test("סימון כנקרא נשמר ומשתקף ב-applyReadState", () => {
  const notes = [
    { id: "a", type: "holiday", message: "חג" },
    { id: "b", type: "unpaid", message: "הורים" },
  ];

  // בהתחלה הכל לא-נקרא
  expect(applyReadState(notes).every((n) => !n.read)).toBe(true);

  markNotificationRead("a");
  const after = applyReadState(notes);
  expect(after.find((n) => n.id === "a").read).toBe(true);
  expect(after.find((n) => n.id === "b").read).toBe(false);
});

test("markAllNotificationsRead מסמן את כל המזהים כנקראו", () => {
  const notes = [
    { id: "x", type: "event", message: "א" },
    { id: "y", type: "gift", message: "ב" },
  ];
  markAllNotificationsRead(notes.map((n) => n.id));
  expect(applyReadState(notes).every((n) => n.read)).toBe(true);
});
