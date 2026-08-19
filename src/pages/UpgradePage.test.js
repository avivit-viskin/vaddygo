import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpgradePage from "./UpgradePage";
import { PRO_PRICE } from "../services/plan";

// קישור תשלום Grow מוגדר — לבדוק שכפתור "מעבר לתשלום מאובטח" מפנה אליו
jest.mock("../config/payment", () => ({
  PRO_PAYMENT_URL: "https://pay.grow.link/test-vaddygo-pro",
  buildPurchaseUrl: (url) => url,
}));

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

test("כפתור השדרוג מפנה לעמוד התשלום המאובטח של Grow", () => {
  renderPage();
  const payLink = screen.getByRole("link", { name: /מעבר לתשלום מאובטח/ });
  expect(payLink.getAttribute("href")).toBe(
    "https://pay.grow.link/test-vaddygo-pro"
  );
});
