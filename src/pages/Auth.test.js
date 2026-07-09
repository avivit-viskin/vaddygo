import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

/*
  טסטים לזרם ההזדהות (UI_SPEC ס' 2): כניסה והרשמה שומרות את ה-token
  שהשרת מחזיר, כדי ש-api.js יצרף אותו לכל בקשה.
*/
function mockAuthResponse() {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          token: "jwt-123",
          username: "avivit",
          role: "Member",
          subscriptionValidUntil: "2027-08-30T23:59:59Z",
        }),
    })
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  delete global.fetch;
});

test("כניסה מוצלחת שומרת את ה-token", async () => {
  mockAuthResponse();
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

  userEvent.type(screen.getByLabelText("שם משתמש או מייל"), "avivit");
  userEvent.type(screen.getByLabelText("סיסמה"), "secret123");
  userEvent.click(screen.getByRole("button", { name: "כניסה" }));

  await waitFor(() => {
    expect(localStorage.getItem("vaadygo.token")).toBe("jwt-123");
  });
  // הבקשה נשלחה ל-endpoint הנכון
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/auth/login"),
    expect.objectContaining({ method: "POST" })
  );
});

test("הרשמה מוצלחת שומרת את ה-token וממשיכה לאשף", async () => {
  mockAuthResponse();
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );

  userEvent.type(screen.getByLabelText("שם משתמש"), "avivit");
  userEvent.type(screen.getByLabelText("כתובת מייל"), "avivit@example.com");
  userEvent.type(screen.getByLabelText("סיסמה"), "secret123");
  userEvent.click(screen.getByRole("button", { name: "יצירת חשבון" }));

  await waitFor(() => {
    expect(localStorage.getItem("vaadygo.token")).toBe("jwt-123");
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/auth/register"),
    expect.objectContaining({ method: "POST" })
  );
});

test("ולידציה בהרשמה חוסמת סיסמה קצרה", () => {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );

  userEvent.type(screen.getByLabelText("שם משתמש"), "av");
  userEvent.type(screen.getByLabelText("כתובת מייל"), "not-an-email");
  userEvent.type(screen.getByLabelText("סיסמה"), "123");
  fireEvent.click(screen.getByRole("button", { name: "יצירת חשבון" }));

  expect(screen.getByText(/שם המשתמש חייב להכיל/)).toBeInTheDocument();
  expect(screen.getByText(/כתובת המייל אינה תקינה/)).toBeInTheDocument();
  expect(screen.getByText(/הסיסמה חייבת להכיל/)).toBeInTheDocument();
});
