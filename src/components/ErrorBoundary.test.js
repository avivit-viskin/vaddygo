import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

function Boom() {
  throw new Error("boom");
}

test("מציג מסך ידידותי (ולא דף לבן) כשקומפוננטה קורסת", () => {
  // React מדפיס את השגיאה ללוג — משתיקים כדי לא להרעיש בפלט הבדיקה
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );
  expect(screen.getByText(/משהו השתבש/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /רענון/ })).toBeInTheDocument();
  spy.mockRestore();
});

test("מציג את התוכן כרגיל כשאין תקלה", () => {
  render(
    <ErrorBoundary>
      <div>הכול תקין</div>
    </ErrorBoundary>
  );
  expect(screen.getByText("הכול תקין")).toBeInTheDocument();
});
