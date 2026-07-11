import { render, screen } from "@testing-library/react";
import StaffBirthdays from "./StaffBirthdays";

/*
  מעל הרשימה מוצגת המלצה כללית אחת: כמה מומלץ להשקיע על מתנות לכל הצוות
  (3% מסך התקציב הכולל, מגיע כ-prop) — סכום אחד, בלי פירוט אישי ובלי אחוזים.
  רשימת הצוות מדומה דרך global.fetch.
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

test("מציג המלצה כללית אחת (3% מהתקציב), בלי סכום אישי ובלי אחוזים", async () => {
  mockStaff(TWO);
  render(<StaffBirthdays totalBudget={10000} />);

  // 3% מ-10,000 = 300 — סכום כללי אחד לכל הצוות
  expect(
    await screen.findByText(/מומלץ להשקיע על מתנות לצוות: 300/)
  ).toBeInTheDocument();
  // בלי סכום אישי לכל אחת, ובלי לכתוב אחוזים
  expect(screen.queryByText(/מומלץ למתנה/)).not.toBeInTheDocument();
  expect(screen.queryByText(/לאיש צוות/)).not.toBeInTheDocument();
  expect(screen.queryByText(/3%/)).not.toBeInTheDocument();
});

test("בלי תקציב (0) לא מוצגת המלצה", async () => {
  mockStaff(ONE);
  render(<StaffBirthdays totalBudget={0} />);
  await screen.findByText("רותי לוי");
  expect(screen.queryByText(/מומלץ להשקיע/)).not.toBeInTheDocument();
});
