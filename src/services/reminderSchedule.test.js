import {
  getCadenceDays,
  setCadenceDays,
  markReminded,
  daysSinceReminded,
  isDue,
} from "./reminderSchedule";

afterEach(() => localStorage.clear());

test("מרווח ברירת מחדל 7 ימים, וניתן לשינוי", () => {
  expect(getCadenceDays()).toBe(7);
  setCadenceDays(3);
  expect(getCadenceDays()).toBe(3);
  setCadenceDays(0); // לא תקין — נשאר 3
  expect(getCadenceDays()).toBe(3);
});

test("הורה שמעולם לא תוזכר — 'מחכה לתזכורת' (due)", () => {
  expect(daysSinceReminded("s1")).toBeNull();
  expect(isDue("s1", 7)).toBe(true);
});

test("אחרי תזכורת — לא due לפני שעבר המרווח, ו-due אחריו", () => {
  const now = new Date("2026-08-01T09:00:00Z");
  markReminded("s1", now);

  const in3Days = new Date("2026-08-04T09:00:00Z");
  expect(daysSinceReminded("s1", in3Days)).toBe(3);
  expect(isDue("s1", 7, in3Days)).toBe(false); // עוד לא עבר המרווח

  const in8Days = new Date("2026-08-09T09:00:00Z");
  expect(isDue("s1", 7, in8Days)).toBe(true); // עבר המרווח → שוב מחכה
});
