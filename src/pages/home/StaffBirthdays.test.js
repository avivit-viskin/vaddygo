import { render, screen } from "@testing-library/react";
import StaffBirthdays from "./StaffBirthdays";

/*
  טסט לתקציב שהמערכת ממליצה למתנה = 3% מסך התקציב הכולל (מגיע כ-prop).
  רשימת הצוות מדומה דרך global.fetch.
*/
const STAFF = [{ id: 1, fullName: "רותי לוי", role: "גננת", birthDate: "1988-07-12" }];

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(STAFF) })
  );
});

afterEach(() => {
  delete global.fetch;
});

test("מציג תקציב מומלץ למתנה = 3% מסך התקציב, ליד יום ההולדת", async () => {
  render(<StaffBirthdays totalBudget={10000} />);
  // 3% מ-10,000 = 300
  expect(await screen.findByText(/מומלץ למתנה: 300 ₪/)).toBeInTheDocument();
});

test("בלי תקציב (0) לא מוצגת המלצה", async () => {
  render(<StaffBirthdays totalBudget={0} />);
  await screen.findByText("רותי לוי");
  expect(screen.queryByText(/מומלץ למתנה/)).not.toBeInTheDocument();
});
