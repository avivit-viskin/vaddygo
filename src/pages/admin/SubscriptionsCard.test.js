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

  // "מנויים בתשלום" ולא "פעילים": המבצע נספר בנפרד, ראו הטסט על trial
  expect(await screen.findByText(/מנויים בתשלום/)).toBeInTheDocument();
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
/*
  המבצע (פרו חינם עד 1.10) נספר ומוצג בנפרד מהמשלמים. אם כולם היו נצבעים
  כ"מנוי", המסך היה מפסיק לענות על השאלה שבשבילה הוא נבנה — מי מכניס כסף.
*/
test("פרו ללא עלות מוצג כמצב נפרד, ולא כמנוי בתשלום", async () => {
  getSubscriptions.mockResolvedValue({
    ...data,
    activeCount: 1,
    trialCount: 1,
    committees: [
      { id: 1, name: "גן משלם", isPro: true, validUntil: "2027-08-10T00:00:00Z", daysLeft: 365, status: "active" },
      { id: 2, name: "גן במבצע", isPro: false, validUntil: "2026-10-01T00:00:00Z", daysLeft: 36, status: "trial" },
    ],
    suppliers: [],
  });

  render(<SubscriptionsCard />);

  await screen.findByText("גן במבצע");
  expect(screen.getByText("פרו ללא עלות")).toBeInTheDocument();
  expect(screen.getByText("מנוי בתשלום")).toBeInTheDocument();
  // הסיכום מפריד בין השניים
  expect(screen.getByText(/בפרו ללא עלות/)).toBeInTheDocument();
});

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

/*
  חשבון מוגן (בוט הבדיקות): נמחק פעם אחת בטעות ממסך זה והשבית את בדיקות ה-E2E
  לשבוע. הבדיקה מוודאת שאי אפשר בכלל לסמן אותו למחיקה מרוכזת — לא שהמחיקה
  נכשלת בשרת, אלא שהיא לא מתחילה.
*/
test("שורה מוגנת אינה ניתנת לסימון למחיקה ומסומנת כמוגנת", async () => {
  getSubscriptions.mockResolvedValue({
    ...data,
    committees: [
      ...data.committees,
      {
        id: 9,
        name: "גן בוט הבדיקות",
        isPro: false,
        validUntil: null,
        status: "free",
        isProtected: true,
      },
    ],
  });

  render(<SubscriptionsCard />);

  expect(await screen.findByText("גן בוט הבדיקות")).toBeInTheDocument();
  expect(screen.getByText("מוגן")).toBeInTheDocument();
  // לשתי השורות הרגילות יש תיבת סימון; למוגנת אין
  expect(
    screen.queryByRole("checkbox", { name: /בחירת גן בוט הבדיקות/ })
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("חשבון מוגן")).toBeInTheDocument();
});
