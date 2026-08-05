import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactsPage from "./ContactsPage";

jest.mock("../services/studentsService", () => ({
  getStudents: () =>
    Promise.resolve([
      { id: 1, firstName: "דנה", lastName: "כהן", className: "פרפרים", parentPhoneNumber: "050-1234567" },
      { id: 2, firstName: "יעל", lastName: "לוי", className: "דבורים", parentPhoneNumber: "052-7654321" },
    ]),
}));

test("מרכז אנשי קשר מהתלמידים, עם כלי שליחה מרוכזת וחיפוש", async () => {
  render(
    <MemoryRouter>
      <ContactsPage />
    </MemoryRouter>
  );

  expect(await screen.findByText("דנה כהן")).toBeInTheDocument();
  expect(screen.getByText("יעל לוי")).toBeInTheDocument();
  // כפתור העתקת כל המספרים (2)
  expect(screen.getByText(/העתקת 2 מספרים/)).toBeInTheDocument();

  // חיפוש מסנן
  fireEvent.change(screen.getByLabelText("חיפוש"), { target: { value: "דבורים" } });
  expect(screen.queryByText("דנה כהן")).not.toBeInTheDocument();
  expect(screen.getByText("יעל לוי")).toBeInTheDocument();
});
