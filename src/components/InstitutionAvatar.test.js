import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InstitutionAvatar from "./InstitutionAvatar";

afterEach(() => localStorage.clear());

test("מציג עיגול עם ראשי התיבות של שתי המילים הראשונות", () => {
  render(<InstitutionAvatar name="גן כוכב" />);
  expect(
    screen.getByRole("button", { name: /פרטי גן כוכב/ })
  ).toHaveTextContent("גכ");
});

test("לחיצה פותחת פופאפ עם שם הגן ומייל ההתחברות", async () => {
  localStorage.setItem(
    "vaadygo.user",
    JSON.stringify({ username: "avivit", email: "avivit@test.com" })
  );
  render(<InstitutionAvatar name="גן כוכב" />);

  await userEvent.click(screen.getByRole("button", { name: /פרטי גן כוכב/ }));

  expect(screen.getByText("גן כוכב")).toBeInTheDocument();
  expect(screen.getByText("avivit@test.com")).toBeInTheDocument();
});
