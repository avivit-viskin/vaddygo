import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WelcomePopup from "./WelcomePopup";
import { markNewUser } from "../services/authService";

afterEach(() => localStorage.clear());

test("קופץ למשתמש חדש, נסגר אחרי 'הבנתי' ולא חוזר בכניסה הבאה", async () => {
  markNewUser(); // מדמים משתמש חדש (נרשם עכשיו)
  const { unmount } = render(<WelcomePopup />);
  expect(screen.getByText(/ברוכים הבאים לפורטל/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /הבנתי/ }));
  expect(screen.queryByText(/ברוכים הבאים לפורטל/)).not.toBeInTheDocument();

  // כניסה הבאה — כבר לא "חדש", לא קופץ שוב
  unmount();
  render(<WelcomePopup />);
  expect(screen.queryByText(/ברוכים הבאים לפורטל/)).not.toBeInTheDocument();
});

test("לא קופץ למשתמש חוזר (שאינו מסומן כחדש)", () => {
  // בלי markNewUser — משתמש חוזר
  render(<WelcomePopup />);
  expect(screen.queryByText(/ברוכים הבאים לפורטל/)).not.toBeInTheDocument();
});
