import { render, screen } from "@testing-library/react";
import PullToRefresh from "./PullToRefresh";

test("נטען ומציג את הנחיית המשיכה (בלי משיכה)", () => {
  render(<PullToRefresh />);
  expect(screen.getByText("משכי לרענון")).toBeInTheDocument();
});
