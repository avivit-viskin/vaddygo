import {
  getStaffWeeklyOff,
  addStaffWeeklyOff,
  removeStaffWeeklyOff,
  weekdayLabel,
  WEEKDAYS,
} from "./staffWeeklyOffService";

beforeEach(() => {
  localStorage.clear();
});

test("מוסיף יום חופש קבוע ומחזיר אותו ברשימה", () => {
  addStaffWeeklyOff({ staffName: "הגננת", weekday: 0 });
  const list = getStaffWeeklyOff();
  expect(list).toHaveLength(1);
  expect(list[0]).toMatchObject({ staffName: "הגננת", weekday: 0 });
});

test("שם עם רווחים נשמר מנוקה, והיום נשמר כמספר גם כשמגיע כמחרוזת", () => {
  const entry = addStaffWeeklyOff({ staffName: "  סייעת  ", weekday: "1" });
  expect(entry.staffName).toBe("סייעת");
  expect(entry.weekday).toBe(1);
});

test("כל רשומה מקבלת מזהה ייחודי — גם כמה רשומות אחת אחרי השנייה", () => {
  addStaffWeeklyOff({ staffName: "גננת", weekday: 0 });
  addStaffWeeklyOff({ staffName: "סייעת", weekday: 1 });
  const ids = getStaffWeeklyOff().map((e) => e.id);
  expect(new Set(ids).size).toBe(2);
});

test("מחיקה מסירה רק את הרשומה המבוקשת", () => {
  const a = addStaffWeeklyOff({ staffName: "גננת", weekday: 0 });
  addStaffWeeklyOff({ staffName: "סייעת", weekday: 1 });
  removeStaffWeeklyOff(a.id);
  const list = getStaffWeeklyOff();
  expect(list).toHaveLength(1);
  expect(list[0].staffName).toBe("סייעת");
});

test("weekdayLabel מחזיר את שם היום בעברית", () => {
  expect(weekdayLabel(0)).toBe("ראשון");
  expect(weekdayLabel(1)).toBe("שני");
  expect(weekdayLabel(6)).toBe("שבת");
  expect(WEEKDAYS).toHaveLength(7);
});
