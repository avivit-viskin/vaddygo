import { render, screen } from "@testing-library/react";
import UsageStatsPage from "./UsageStatsPage";
import { getUsageStats } from "../services/usageStatsService";
import { isSuperAdmin } from "../services/authService";
import {
  applyBaseline,
  setBaseline,
  clearBaseline,
} from "../services/usageBaseline";

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
    registeredLast5Days: 1,
    registeredLast30Days: 4,
  },
  suppliers: {
    registered: 5,
    completed: 1,
    stopped: 4,
    registeredLast5Days: 0,
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
  // שני חלונות זמן: החלון הקצר מראה מה קרה עכשיו, הארוך מראה מגמה
  expect(screen.getByText(/נרשמו ב-5 הימים האחרונים: 1/)).toBeInTheDocument();
  expect(screen.getByText(/נרשמו ב-5 הימים האחרונים: 0/)).toBeInTheDocument();
});

/*
  "איפוס תצוגה" שומר צילום של המספרים הנוכחיים ומציג רק את מה שנוסף מעליהם.
  בלי שהחלון החדש ייכלל בצילום, המספר של 5 הימים היה ממשיך להציג את המצב
  המלא אחרי איפוס — כלומר האיפוס היה נראה שבור דווקא במספר החשוב ביותר.
*/
test("איפוס תצוגה מקזז גם את חלון 5 הימים", () => {
  const funnel = {
    registered: 10,
    completed: 7,
    registeredLast5Days: 3,
    registeredLast30Days: 6,
  };
  const base = setBaseline("committees", funnel);
  expect(applyBaseline(funnel, base).registeredLast5Days).toBe(0);

  const later = { ...funnel, registered: 12, registeredLast5Days: 5 };
  expect(applyBaseline(later, base).registeredLast5Days).toBe(2);
  clearBaseline("committees");
});

test("שגיאה מהשרת מוצגת ולא מפילה את המסך", async () => {
  getUsageStats.mockRejectedValue(new Error("לא הצלחנו להתחבר לשרת"));
  render(<UsageStatsPage />);

  expect(await screen.findByText(/לא הצלחנו להתחבר לשרת/)).toBeInTheDocument();
});
