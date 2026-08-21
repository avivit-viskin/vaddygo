import { render, screen } from "@testing-library/react";
import SubscriptionsCard from "./SubscriptionsCard";
import userEvent from "@testing-library/user-event";
import {
  getSubscriptions,
  setCommitteePro,
} from "../../services/subscriptionsService";

jest.mock("../../services/subscriptionsService", () => ({
  ...jest.requireActual("../../services/subscriptionsService"),
  getSubscriptions: jest.fn(),
  setCommitteePro: jest.fn(),
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

/*
  פתיחה ידנית של פרו לגן. עד שנוספה, מסלול פרו לוועד נפתח **רק** אוטומטית
  אחרי תשלום — כלומר לא היה שום אופן לתת אותו לגן פיילוט או ללקוחה שמשלמת
  בהעברה, וזו הייתה הבקשה.
*/
test("לגן שאינו מנוי מוצע לפתוח פרו, ולגן מנוי מוצע לסגור", async () => {
  getSubscriptions.mockResolvedValue(data);
  render(<SubscriptionsCard />);

  await screen.findByText("גן הפרחים");
  // "גן הפרחים" מנוי פעיל, "גן הרימון" לא
  expect(screen.getByRole("button", { name: "סגירת פרו" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "פתיחת פרו" })).toBeInTheDocument();
});

test("לחיצה על פתיחת פרו שולחת את מזהה הגן ומרעננת", async () => {
  getSubscriptions.mockResolvedValue(data);
  setCommitteePro.mockResolvedValue({ message: "מסלול פרו נפתח לגן" });

  render(<SubscriptionsCard />);
  await screen.findByText("גן הרימון");

  await userEvent.click(screen.getByRole("button", { name: "פתיחת פרו" }));

  // פרו הוא per-gan — נשלח מזהה הגן, לא מזהה החשבון
  // בלי מספר חודשים — השרת קובע ברירת מחדל של שנה, כמו מנוי בתשלום
  expect(setCommitteePro).toHaveBeenCalledWith(2, true);
  expect(await screen.findByText(/מסלול פרו נפתח לגן/)).toBeInTheDocument();
});

/*
  סגירה בטעות מורידה פיצ'רים מלקוחה משלמת, ולכן היא נשאלת לאישור — בעוד
  פתיחה בטעות היא אי-נוחות שמתקנים בלחיצה חוזרת.
*/
test("סגירת פרו מבקשת אישור, וביטול אינו שולח דבר", async () => {
  getSubscriptions.mockResolvedValue(data);
  const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

  render(<SubscriptionsCard />);
  await screen.findByText("גן הפרחים");

  await userEvent.click(screen.getByRole("button", { name: "סגירת פרו" }));

  expect(confirmSpy).toHaveBeenCalled();
  expect(setCommitteePro).not.toHaveBeenCalled();
  confirmSpy.mockRestore();
});

test("ספקים אינם מקבלים את הכפתור — הפרו שלהם נפתח במסך הספקים", async () => {
  getSubscriptions.mockResolvedValue(data);
  render(<SubscriptionsCard />);

  await screen.findByText("גן הפרחים");
  // שני גנים = שני כפתורים בלבד, אף אחד מהם אינו של ספק
  expect(screen.getAllByRole("button", { name: /פרו/ })).toHaveLength(2);
});
