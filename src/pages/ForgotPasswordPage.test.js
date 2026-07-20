import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "./ForgotPasswordPage";
import { requestPasswordReset } from "../services/authService";

jest.mock("../services/authService", () => ({
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ForgotPasswordPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  requestPasswordReset.mockReset();
});

test("מייל לא תקין לא ממשיך לשלב הקוד", async () => {
  renderPage();
  await userEvent.type(screen.getByLabelText("כתובת המייל שלך"), "לא-מייל");
  await userEvent.click(screen.getByRole("button", { name: "שלחו לי קוד" }));
  expect(screen.getByText("כתובת המייל אינה תקינה")).toBeInTheDocument();
  expect(requestPasswordReset).not.toHaveBeenCalled();
});

test("מייל תקין עובר לשלב הזנת הקוד והסיסמה", async () => {
  requestPasswordReset.mockResolvedValue({});
  renderPage();
  await userEvent.type(screen.getByLabelText("כתובת המייל שלך"), "a@b.com");
  await userEvent.click(screen.getByRole("button", { name: "שלחו לי קוד" }));
  expect(await screen.findByLabelText("הקוד מהמייל")).toBeInTheDocument();
  expect(screen.getByLabelText("סיסמה חדשה")).toBeInTheDocument();
  expect(requestPasswordReset).toHaveBeenCalledWith("a@b.com");
});
