import { loadUpcomingMonth } from "./upcomingMonth";
import { getStaff } from "./staffService";
import { getStudents } from "./studentsService";
import { upcomingHolidays } from "./upcomingHoliday";

/*
  בדיקות לתזכורות מסך המתנות: חגים עד שבועיים לפני, ימי הולדת (צוות + ילדים)
  עד שבוע לפני, ורק אלה. משמרים את חישוב יום ההולדת האמיתי (nextBirthday).
*/
jest.mock("./staffService", () => {
  const actual = jest.requireActual("./staffService");
  return { ...actual, getStaff: jest.fn() };
});
jest.mock("./studentsService", () => ({ getStudents: jest.fn() }));
jest.mock("./upcomingHoliday", () => ({ upcomingHolidays: jest.fn() }));

const TODAY = new Date(2026, 0, 15); // 15.1.2026

test("מציג חגים עד שבועיים וימי הולדת (צוות+ילדים) עד שבוע, ממוין לפי קרבה", async () => {
  upcomingHolidays.mockReturnValue([
    { key: "פסח|5786", name: "פסח", daysUntil: 10 }, // בתוך שבועיים
    { key: "שבועות|5786", name: "שבועות", daysUntil: 20 }, // מעבר לשבועיים
  ]);
  getStaff.mockResolvedValue([
    { id: 1, fullName: "הגננת רותי", birthDate: "1990-01-20" }, // בעוד 5 ימים
    { id: 2, fullName: "הסייעת דנה", birthDate: "1990-01-25" }, // בעוד 10 ימים
  ]);
  getStudents.mockResolvedValue([
    { id: 9, firstName: "יעל", lastName: "כהן", birthDate: "2020-01-18" }, // בעוד 3 ימים
  ]);

  const items = await loadUpcomingMonth(TODAY);
  const labels = items.map((i) => i.label);

  expect(labels).toContain("פסח");
  expect(labels).toContain("יום הולדת להגננת רותי");
  expect(labels).toContain("יום הולדת ליעל כהן"); // יום הולדת של ילד
  expect(labels).not.toContain("שבועות"); // מעבר לשבועיים
  expect(labels).not.toContain("יום הולדת להסייעת דנה"); // מעבר לשבוע
  expect(items[0].label).toBe("יום הולדת ליעל כהן"); // הקרוב ביותר קודם
});
