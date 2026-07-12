import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WelcomePopup from "./WelcomePopup";

afterEach(() => localStorage.clear());

test("קופץ בכניסה, נסגר אחרי 'הבנתי' ולא חוזר בכניסה הבאה", async () => {
  const { unmount } = render(<WelcomePopup />);
  expect(screen.getByText(/ברוכים הבאים לפורטל/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /הבנתי/ }));
  expect(screen.queryByText(/ברוכים הבאים לפורטל/)).not.toBeInTheDocument();

  unmount();
  render(<WelcomePopup />);
  expect(screen.queryByText(/ברוכים הבאים לפורטל/)).not.toBeInTheDocument();
});
