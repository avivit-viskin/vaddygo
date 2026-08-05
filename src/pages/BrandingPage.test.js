import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BrandingPage from "./BrandingPage";

afterEach(() => localStorage.clear());

test("מציג מסך מיתוג עם העלאת לוגו, בחירת צבע ותצוגה מקדימה", () => {
  render(
    <MemoryRouter>
      <BrandingPage />
    </MemoryRouter>
  );

  expect(screen.getByText("העלאת לוגו")).toBeInTheDocument();
  expect(screen.getByLabelText("צבע המותג")).toBeInTheDocument();
  expect(screen.getByText(/תצוגה מקדימה/)).toBeInTheDocument();
});
