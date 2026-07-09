import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilesPage from "../FilesPage";

/*
  טסטים למסך הקבצים (UI_SPEC ס' 13). אין שרת בטסטים — השירות נופל ל-localStorage.
*/
beforeEach(() => {
  localStorage.clear();
});

test("מצב ריק: הזמנה להוסיף תיקייה ראשונה", async () => {
  render(<FilesPage />);
  expect(await screen.findByText(/עדיין אין תיקיות/)).toBeInTheDocument();
});

test("הוספת תיקייה מציגה אותה כקישור שנפתח בדרייב", async () => {
  render(<FilesPage />);
  await screen.findByText(/עדיין אין תיקיות/);

  userEvent.click(screen.getByRole("button", { name: "+ הוספת תיקייה" }));
  userEvent.type(screen.getByLabelText("שם התיקייה"), "יום המשפחה");
  userEvent.type(
    screen.getByLabelText("קישור התיקייה מ-Google Drive"),
    "https://drive.google.com/drive/folders/abc123"
  );
  userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  const link = await screen.findByRole("link", { name: /יום המשפחה/ });
  expect(link).toHaveAttribute(
    "href",
    "https://drive.google.com/drive/folders/abc123"
  );
  expect(link).toHaveAttribute("target", "_blank");
});

test("ולידציה חוסמת קישור שאינו מתחיל ב-http", async () => {
  render(<FilesPage />);
  await screen.findByText(/עדיין אין תיקיות/);

  userEvent.click(screen.getByRole("button", { name: "+ הוספת תיקייה" }));
  userEvent.type(screen.getByLabelText("שם התיקייה"), "בדיקה");
  userEvent.type(
    screen.getByLabelText("קישור התיקייה מ-Google Drive"),
    "לא-קישור"
  );
  userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(screen.getByText(/הקישור צריך להתחיל ב-http/)).toBeInTheDocument();
});
