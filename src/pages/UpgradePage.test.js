import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpgradePage from "./UpgradePage";
import { PRO_PRICE } from "../services/plan";

afterEach(() => localStorage.clear());

function renderPage() {
  return render(
    <MemoryRouter>
      <UpgradePage />
    </MemoryRouter>
  );
}

test("מציג את מחיר הפרו ואת ההטבות שאינן כלים", () => {
  renderPage();
  expect(screen.getByText(new RegExp(String(PRO_PRICE)))).toBeInTheDocument();
  expect(screen.getByText(/עוזרת AI מלאה/)).toBeInTheDocument();
  expect(screen.getByText(/תמיכה מועדפת/)).toBeInTheDocument();
});

test("מרכז את כל כלי הפרו כקישורים למסכים שלהם", () => {
  renderPage();
  expect(
    screen.getByRole("link", { name: /דוח שנתי להורים/ }).getAttribute("href")
  ).toBe("/annual-report");
  expect(
    screen.getByRole("link", { name: /ספר קשרים ושליחה/ }).getAttribute("href")
  ).toBe("/contacts");
});

test("כפתור השדרוג מוביל למסך התשלום הפנימי (שם אפשר לפתוח פרו)", () => {
  renderPage();
  const payLink = screen.getByRole("link", { name: /מעבר לתשלום/ });
  expect(payLink.getAttribute("href")).toContain("/pay");
});
