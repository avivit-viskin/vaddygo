import { birthdaysByDayForMonth, getBirthdays } from "./birthdaysService";
import { getStaff } from "./staffService";
import { getStudents } from "./studentsService";

jest.mock("./staffService", () => ({ getStaff: jest.fn() }));
jest.mock("./studentsService", () => ({ getStudents: jest.fn() }));

describe("birthdaysByDayForMonth", () => {
  test("מסנן לפי חודש הלידה ומקבץ לפי יום (בלי תלות בשנה)", () => {
    const birthdays = [
      { name: "רותי", birthDate: "1990-03-15", type: "staff" },
      { name: "דני לוי", birthDate: "2020-03-15", type: "student" },
      { name: "מיכל", birthDate: "1985-07-02", type: "staff" }, // חודש אחר
    ];
    const map = birthdaysByDayForMonth(birthdays, 2); // מרץ (0-based)

    expect(map.get(15)).toEqual([
      { name: "רותי", type: "staff" },
      { name: "דני לוי", type: "student" },
    ]);
    expect(map.has(2)).toBe(false); // יולי לא נכנס
  });

  test("מתעלם מתאריך לידה לא תקין", () => {
    const map = birthdaysByDayForMonth(
      [{ name: "x", birthDate: "not-a-date", type: "staff" }],
      0
    );
    expect(map.size).toBe(0);
  });
});

describe("getBirthdays", () => {
  test("מאחד צוות ותלמידים ומסנן מי שאין לו תאריך לידה", async () => {
    getStaff.mockResolvedValue([
      { fullName: "רותי כהן", birthDate: "1990-03-15" },
      { fullName: "בלי תאריך" }, // בלי birthDate — מסונן
    ]);
    getStudents.mockResolvedValue([
      { firstName: "דני", lastName: "לוי", birthDate: "2020-05-01" },
    ]);

    const result = await getBirthdays();

    expect(result).toEqual([
      { name: "רותי כהן", birthDate: "1990-03-15", type: "staff" },
      { name: "דני לוי", birthDate: "2020-05-01", type: "student" },
    ]);
  });
});
