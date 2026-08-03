import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpgradePage from "./UpgradePage";
import { PRO_PRICE } from "../services/plan";

function renderPage() {
  return render(
    <MemoryRouter>
      <UpgradePage />
    </MemoryRouter>
  );
}

test("מציג את מחיר הפרו ורשימת הטבות", () => {
  renderPage();
  expect(screen.getByText(new RegExp(String(PRO_PRICE)))).toBeInTheDocument();
  expect(screen.getByText(/עוזרת AI מלאה/)).toBeInTheDocument();
  expect(screen.getByText(/תמיכה מועדפת/)).toBeInTheDocument();
});

test("מבהיר שהפיצ'רים עדיין פתוחים לכולם", () => {
  renderPage();
  expect(screen.getByText(/פתוחים לכולם/)).toBeInTheDocument();
});
