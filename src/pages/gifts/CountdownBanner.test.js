import { render, screen } from "@testing-library/react";
import CountdownBanner from "./CountdownBanner";
import { nextHoliday } from "../../services/upcomingHoliday";

/*
  CountdownBanner — בשבוע שלפני האירוע (≤7 ימים) הופך לתזכורת לסידור המתנות.
  ממקמים את החג הקרוב דרך מוק כדי שהבדיקה תהיה יציבה (לא תלויה בתאריך אמיתי).
*/
jest.mock("../../services/upcomingHoliday");

afterEach(() => {
  jest.resetAllMocks();
});

test("בשבוע שלפני האירוע מציג תזכורת לסידור המתנות", () => {
  nextHoliday.mockReturnValue({
    name: "חנוכה",
    date: new Date(2026, 11, 6),
    daysUntil: 5,
  });

  render(<CountdownBanner />);

  expect(screen.getByText(/זה הזמן לסדר את המתנות/)).toBeInTheDocument();
  expect(screen.getByText(/חנוכה ב-/)).toBeInTheDocument(); // כותרת הספירה
});

test("כשהאירוע רחוק (יותר משבוע) — ספירה לאחור בלי תזכורת", () => {
  nextHoliday.mockReturnValue({
    name: "פסח",
    date: new Date(2027, 3, 1),
    daysUntil: 40,
  });

  render(<CountdownBanner />);

  expect(screen.queryByText(/זה הזמן לסדר את המתנות/)).not.toBeInTheDocument();
  expect(screen.getByText(/נשארו עוד 40 ימים/)).toBeInTheDocument();
});
