import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RemindersPage from "./RemindersPage";

jest.mock("../services/studentsService", () => ({
  getStudents: () =>
    Promise.resolve([
      { id: 1, firstName: "דנה", lastName: "כהן", parentPhoneNumber: "050-1234567" },
      { id: 2, firstName: "יעל", lastName: "לוי", parentPhoneNumber: "052-7654321" },
    ]),
}));
jest.mock("../services/paymentsService", () => ({
  getAllPaymentSummaries: () =>
    Promise.resolve([
      { studentId: 1, hasUnpaid: true },
      { studentId: 2, hasUnpaid: false },
    ]),
  buildWhatsappReminderUrl: (phone, msg) =>
    `https://wa.me/972501234567?text=${encodeURIComponent(msg)}`,
}));

afterEach(() => localStorage.clear());

test("מציג רק הורים שטרם שילמו, ומי שלא תוזכר נכנס ל'מחכים לתזכורת'", async () => {
  render(
    <MemoryRouter>
      <RemindersPage />
    </MemoryRouter>
  );

  expect(await screen.findByText("דנה כהן")).toBeInTheDocument();
  // יעל שילמה → לא ברשימה
  expect(screen.queryByText("יעל לוי")).not.toBeInTheDocument();
  expect(screen.getByText(/מחכים לתזכורת עכשיו/)).toBeInTheDocument();
});
