import { render, screen } from "@testing-library/react";
import SubscriptionsCard from "./SubscriptionsCard";
import { getSubscriptions } from "../../services/subscriptionsService";

jest.mock("../../services/subscriptionsService", () => ({
  ...jest.requireActual("../../services/subscriptionsService"),
  getSubscriptions: jest.fn(),
}));

/*
  המסך עונה על שאלה עסקית: מה פעיל ומה עומד לפוג. לכן הבדיקות מתמקדות בכך
  שהסטטוסים והתאריכים מוצגים נכון — ולא בעיצוב.
*/
const data = {
  activeCount: 3,
  expiringSoonCount: 1,
  committees: [
    {
      id: 1,
      name: "גן הפרחים",
      isPro: true,
      validUntil: "2027-08-10T00:00:00Z",
      daysLeft: 365,
      status: "active",
    },
    { id: 2, name: "גן הרימון", isPro: false, validUntil: null, status: "free" },
  ],
  suppliers: [
    {
      id: 5,
      name: "מתנות בלב",
      isPro: true,
      validUntil: "2026-09-01T00:00:00Z",
      daysLeft: 22,
      status: "expiring",
    },
    {
      id: 6,
      name: "בלונים ועוד",
      isPro: true,
      validUntil: null,
      status: "active",
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  getSubscriptions.mockResolvedValue(data);
});

test("מציג סיכום, ושני הערוצים עם הסטטוס של כל אחד", async () => {
  render(<SubscriptionsCard />);

  expect(await screen.findByText(/מנויים פעילים/)).toBeInTheDocument();
  expect(screen.getByText(/1 פגים בתוך 30 יום/)).toBeInTheDocument();

  expect(screen.getByText("גן הפרחים")).toBeInTheDocument();
  expect(screen.getByText("מתנות בלב")).toBeInTheDocument();

  // "פג בקרוב" הוא האזהרה שבגללה המסך קיים
  expect(screen.getByText("פג בקרוב")).toBeInTheDocument();
  expect(screen.getByText("לא מנוי")).toBeInTheDocument();
});

test("מנוי בלי תאריך תפוגה מוסבר במילים ולא במקף", async () => {
  render(<SubscriptionsCard />);

  expect(await screen.findByText("ללא תאריך תפוגה")).toBeInTheDocument();
  // ומי שאינו מנוי מקבל מקף
  expect(screen.getByText("—")).toBeInTheDocument();
});

test("שגיאה מהשרת מוצגת ולא מפילה את המסך", async () => {
  getSubscriptions.mockRejectedValue(new Error("אין הרשאה"));
  render(<SubscriptionsCard />);

  expect(await screen.findByText(/אין הרשאה/)).toBeInTheDocument();
});
