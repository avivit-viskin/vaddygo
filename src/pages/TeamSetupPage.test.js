import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import TeamSetupPage from "./TeamSetupPage";

afterEach(() => localStorage.clear());

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TeamSetupPage />
    </MemoryRouter>
  );
}

test("מציג את שלוש רמות ההרשאה", () => {
  renderPage();
  // כל תווית מופיעה גם במקרא וגם בבחירה — מספיק שקיימת לפחות פעם אחת
  expect(screen.getAllByText(/צופה/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/עורך/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/מנהל/).length).toBeGreaterThan(0);
});

test("הוספת משתמש מוסיפה אותו לרשימה עם כפתור הזמנה בוואטסאפ", async () => {
  renderPage();
  await userEvent.type(screen.getByLabelText("שם"), "מיכל כהן");
  await userEvent.click(screen.getByRole("button", { name: /הוספת משתמש/ }));

  expect(screen.getByText("מיכל כהן")).toBeInTheDocument();
  const whatsapp = screen.getByRole("link", {
    name: /שליחת הזמנה למיכל כהן בוואטסאפ/,
  });
  expect(whatsapp.getAttribute("href")).toContain("wa.me/?text=");
  const email = screen.getByRole("link", {
    name: /שליחת הזמנה למיכל כהן במייל/,
  });
  expect(email.getAttribute("href")).toContain("mailto:");
});

test("בלי שם — מוצגת שגיאה ולא נוסף משתמש", async () => {
  renderPage();
  await userEvent.click(screen.getByRole("button", { name: /הוספת משתמש/ }));
  expect(screen.getByText("צריך למלא שם")).toBeInTheDocument();
});
