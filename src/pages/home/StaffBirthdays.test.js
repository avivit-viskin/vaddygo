import { render, screen } from "@testing-library/react";
import StaffBirthdays from "./StaffBirthdays";

/*
  תקציב המתנות = 3% מסך התקציב הכולל (מגיע כ-prop), והוא סכום *כולל* לכל
  הצוות שמתחלק שווה בשווה בין אנשי הצוות. רשימת הצוות מדומה דרך global.fetch.
*/
const ONE = [{ id: 1, fullName: "רותי לוי", role: "גננת", birthDate: "1988-07-12" }];
const TWO = [
  { id: 1, fullName: "רותי לוי", role: "גננת", birthDate: "1988-07-12" },
  { id: 2, fullName: "דנה כהן", role: "סייעת", birthDate: "1990-03-04" },
];

function mockStaff(list) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(list) })
  );
}

afterEach(() => {
  delete global.fetch;
});

test("איש צוות אחד מקבל את כל 3% התקציב", async () => {
  mockStaff(ONE);
  render(<StaffBirthdays totalBudget={10000} />);
  // 3% מ-10,000 = 300, ויש רק איש צוות אחד → 300 לאיש
  expect(await screen.findByText(/מומלץ למתנה: 300 ₪/)).toBeInTheDocument();
});

test("3% הם סכום כולל שמתחלק בין אנשי הצוות", async () => {
  mockStaff(TWO);
  render(<StaffBirthdays totalBudget={10000} />);
  // סכום כולל 3% מ-10,000 = 300, מתחלק ל-2 → 150 לכל איש צוות
  const perMember = await screen.findAllByText(/מומלץ למתנה: 150 ₪/);
  expect(perMember).toHaveLength(2);
  // שורת הסיכום מציגה את הסכום הכולל 300
  expect(screen.getByText(/תקציב מתנות לכל הצוות: 300 ₪/)).toBeInTheDocument();
});

test("בלי תקציב (0) לא מוצגת המלצה", async () => {
  mockStaff(ONE);
  render(<StaffBirthdays totalBudget={0} />);
  await screen.findByText("רותי לוי");
  expect(screen.queryByText(/מומלץ למתנה/)).not.toBeInTheDocument();
});
