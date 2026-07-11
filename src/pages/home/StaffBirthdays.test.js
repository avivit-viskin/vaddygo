import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffBirthdays from "./StaffBirthdays";

/*
  טסט לתקציב המומלץ למתנה לאיש צוות (נשמר ב-localStorage).
  רשימת הצוות מדומה דרך global.fetch.
*/
const STAFF = [{ id: 1, fullName: "רותי לוי", role: "גננת", birthDate: "1988-07-12" }];

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(STAFF) })
  );
});

afterEach(() => {
  delete global.fetch;
});

test("אפשר להגדיר תקציב מומלץ למתנה, והוא מוצג ליד יום ההולדת ונשמר", async () => {
  render(<StaffBirthdays />);
  await screen.findByText("רותי לוי");

  // עדיין אין תקציב — לוחצים כדי להוסיף
  await userEvent.click(screen.getByRole("button", { name: /הוסיפי תקציב מתנה/ }));
  await userEvent.type(screen.getByLabelText(/תקציב מומלץ למתנה/), "150");
  await userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  // התקציב מוצג ליד השם
  expect(await screen.findByText(/תקציב מתנה: 150 ₪/)).toBeInTheDocument();
  // ונשמר ב-localStorage
  expect(
    JSON.parse(localStorage.getItem("vaadygo.staffGiftBudgets"))
  ).toEqual({ 1: 150 });
});
