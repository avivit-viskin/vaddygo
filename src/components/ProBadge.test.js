import { render, screen } from "@testing-library/react";
import ProBadge from "./ProBadge";

test("מציג את תווית הפרו", () => {
  render(<ProBadge />);
  expect(screen.getByText(/פרו/)).toBeInTheDocument();
});

test("מקבל תווית מותאמת", () => {
  render(<ProBadge label="PRO" />);
  expect(screen.getByText(/PRO/)).toBeInTheDocument();
});
