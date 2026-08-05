import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpgradePage from "./UpgradePage";
import { PRO_PRICE } from "../services/plan";

// קישור תשלום מוגדר — כדי לבדוק שכפתור "מעבר לתשלום מאובטח" מופיע
jest.mock("../config/payment", () => ({
  PRO_PAYMENT_URL: "https://grow.example/pay/vaddygo-pro",
}));

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

test("כשמוגדר קישור תשלום — מופיע כפתור 'מעבר לתשלום מאובטח' לקישור", () => {
  renderPage();
  const payLink = screen.getByRole("link", { name: /מעבר לתשלום מאובטח/ });
  expect(payLink.getAttribute("href")).toBe(
    "https://grow.example/pay/vaddygo-pro"
  );
});
