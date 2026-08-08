import { render, screen } from "@testing-library/react";
import UsageStatsPage from "./UsageStatsPage";
import { getUsageStats } from "../services/usageStatsService";
import { isSuperAdmin } from "../services/authService";

jest.mock("../services/usageStatsService", () => ({
  ...jest.requireActual("../services/usageStatsService"),
  getUsageStats: jest.fn(),
}));
jest.mock("../services/authService", () => ({
  isSuperAdmin: jest.fn(),
}));

const stats = {
  committees: {
    registered: 10,
    completed: 7,
    stopped: 3,
    registeredLast30Days: 4,
  },
  suppliers: {
    registered: 5,
    completed: 1,
    stopped: 4,
    registeredLast30Days: 2,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  isSuperAdmin.mockReturnValue(true);
  getUsageStats.mockResolvedValue(stats);
});

test("מי שאינה מנהלת לא רואה נתונים", () => {
  isSuperAdmin.mockReturnValue(false);
  render(<UsageStatsPage />);

  expect(screen.getByText(/מיועד למנהלת/)).toBeInTheDocument();
  expect(getUsageStats).not.toHaveBeenCalled();
});

test("מציג את שני המשפכים עם המספרים משרת", async () => {
  render(<UsageStatsPage />);

  expect(await screen.findByText("ועדי הורים")).toBeInTheDocument();
  expect(screen.getByText("ספקים")).toBeInTheDocument();

  // ועדים: 7 מתוך 10 = 70%; ספקים: 1 מתוך 5 = 20%
  const bars = screen.getAllByRole("progressbar");
  expect(bars[0]).toHaveAttribute("aria-valuenow", "70");
  expect(bars[1]).toHaveAttribute("aria-valuenow", "20");

  expect(screen.getByText(/3 נרשמו ולא סיימו את האשף/)).toBeInTheDocument();
  expect(screen.getByText(/4 נרשמו ולא השלימו את הכרטיס/)).toBeInTheDocument();
  expect(screen.getByText(/נרשמו ב-30 הימים האחרונים: 4/)).toBeInTheDocument();
});

test("שגיאה מהשרת מוצגת ולא מפילה את המסך", async () => {
  getUsageStats.mockRejectedValue(new Error("לא הצלחנו להתחבר לשרת"));
  render(<UsageStatsPage />);

  expect(await screen.findByText(/לא הצלחנו להתחבר לשרת/)).toBeInTheDocument();
});
