import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import TeamSetupPage from "./TeamSetupPage";
import * as teamService from "../services/teamService";

// ה-TeamManager מדבר עכשיו עם ה-API האמיתי — ממקים את קריאות הרשת בלבד
// (ROLES/roleLabel/inviteLink נשארים אמיתיים).
jest.mock("../services/teamService", () => {
  const actual = jest.requireActual("../services/teamService");
  return {
    ...actual,
    getTeam: jest.fn(),
    createInvite: jest.fn(),
    cancelInvite: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRole: jest.fn(),
  };
});

beforeEach(() => {
  teamService.getTeam.mockResolvedValue({
    members: [],
    pendingInvites: [],
    canManage: true,
  });
  teamService.createInvite.mockResolvedValue({
    id: 1,
    token: "tok123",
    role: "viewer",
    inviteeName: "מיכל כהן",
  });
  window.open = jest.fn();
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TeamSetupPage />
    </MemoryRouter>
  );
}

test("מציג את שלוש רמות ההרשאה", async () => {
  renderPage();
  await waitFor(() => expect(teamService.getTeam).toHaveBeenCalled());
  // כל תווית מופיעה גם במקרא וגם בבחירה — מספיק שקיימת לפחות פעם אחת
  expect(screen.getAllByText(/צופה/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/עורך/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/מנהל/).length).toBeGreaterThan(0);
});

test("יצירת הזמנה קוראת ל-API ופותחת שיתוף בוואטסאפ", async () => {
  renderPage();
  await waitFor(() => expect(teamService.getTeam).toHaveBeenCalled());

  await userEvent.type(screen.getByLabelText("שם"), "מיכל כהן");
  await userEvent.click(screen.getByRole("button", { name: /יצירת הזמנה/ }));

  await waitFor(() =>
    expect(teamService.createInvite).toHaveBeenCalledWith("viewer", "מיכל כהן")
  );
  // נפתח שיתוף וואטסאפ עם קישור ההזמנה האמיתי
  expect(window.open).toHaveBeenCalled();
});

test("בלי שם — מוצגת שגיאה ולא נוצרת הזמנה", async () => {
  renderPage();
  await waitFor(() => expect(teamService.getTeam).toHaveBeenCalled());

  await userEvent.click(screen.getByRole("button", { name: /יצירת הזמנה/ }));

  expect(screen.getByText("צריך למלא שם")).toBeInTheDocument();
  expect(teamService.createInvite).not.toHaveBeenCalled();
});
