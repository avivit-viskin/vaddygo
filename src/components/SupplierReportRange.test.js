import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SupplierReportRange from "./SupplierReportRange";
import { getSupplierReport } from "../services/supplierReportService";
import { presetRanges } from "../services/supplierReportService";

jest.mock("../services/supplierReportService", () => ({
  ...jest.requireActual("../services/supplierReportService"),
  getSupplierReport: jest.fn(),
}));

const BASE = {
  from: "2026-07-21T00:00:00Z",
  to: "2026-08-20T23:59:59Z",
  views: { total: 120, inRange: 14, trackedSince: "2026-08-01T00:00:00Z", rangeStartsBeforeTracking: false },
  leads: { total: 9, inRange: 3, byStatus: { new: 2, won: 1 } },
  products: { total: 12, lastAddedAt: "2026-08-18T10:00:00Z", addedInRange: 2, withoutDate: 0 },
  placement: {
    area: "רעננה",
    rank: 3,
    outOf: 11,
    featured: false,
    category: "מתנות",
    rankInCategory: 2,
    outOfInCategory: 4,
  },
  lastEditedAt: "2026-08-19T09:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  getSupplierReport.mockResolvedValue(BASE);
});

test("מציג את מספרי התקופה ואת המיקום ברשימה", async () => {
  render(<SupplierReportRange token="tok" />);

  expect(await screen.findByText("14")).toBeInTheDocument();
  expect(screen.getByText("צפיות בתקופה")).toBeInTheDocument();
  expect(screen.getByText(/מופיעים במקום/)).toBeInTheDocument();
  expect(screen.getByText("רעננה")).toBeInTheDocument();
  // המיקום הכללי (3 מתוך 11) והמיקום בקטגוריה (2 מתוך 4) הם שני נתונים שונים
  expect(screen.getByText(/מתוך 11/)).toBeInTheDocument();
  expect(screen.getByText(/מתוך 4/)).toBeInTheDocument();
  expect(screen.getByText("מתנות")).toBeInTheDocument();
});

/*
  זו הבקשה המקורית — השוואת שנה לשנה. אם היא דורשת מילוי ידני של תאריכים
  בכל פעם, בפועל לא ישתמשו בה; לכן קיים טווח מוכן ללחיצה אחת.
*/
test("בחירת שנת פעילות קודמת נשלחת לשרת כטווח ספטמבר–אוגוסט", async () => {
  render(<SupplierReportRange token="tok" />);
  await screen.findByText("14");

  const lastYear = presetRanges().find((p) => p.key === "lastYear");
  await userEvent.click(screen.getByRole("button", { name: lastYear.label }));

  expect(getSupplierReport).toHaveBeenLastCalledWith("tok", {
    from: lastYear.from,
    to: lastYear.to,
  });
  expect(lastYear.from.endsWith("-09-01")).toBe(true);
  expect(lastYear.to.endsWith("-08-31")).toBe(true);
});

/*
  ספירת הצפיות היומית התחילה מאוחר מהמערכת עצמה. בלי המשפט המסביר, תקופה
  ישנה מציגה 0 — ומי שקורא מסיק "אף אחד לא נכנס אליי", שזו מסקנה שגויה.
*/
test("תקופה שקודמת לתחילת הספירה מלווה בהסבר ולא רק ב-0", async () => {
  getSupplierReport.mockResolvedValue({
    ...BASE,
    views: { ...BASE.views, inRange: 0, rangeStartsBeforeTracking: true },
  });

  render(<SupplierReportRange token="tok" />);

  expect(await screen.findByText(/ספירת הצפיות לפי תאריך התחילה/)).toBeInTheDocument();
  expect(screen.getByText("120")).toBeInTheDocument();
});

test("ספק בלי אזור מקבל הסבר מה לעשות, לא מקום 0", async () => {
  getSupplierReport.mockResolvedValue({
    ...BASE,
    placement: { area: "", rank: 0, outOf: 0, featured: false, category: "", rankInCategory: 0, outOfInCategory: 0 },
  });

  render(<SupplierReportRange token="tok" />);

  expect(await screen.findByText(/לא הוגדר אזור בכרטיס/)).toBeInTheDocument();
  expect(screen.queryByText(/מופיעים במקום/)).toBeNull();
});

test("מוצג מתי נערך הכרטיס ומתי נוסף מוצר לאחרונה", async () => {
  render(<SupplierReportRange token="tok" />);

  expect(await screen.findByText(/עריכת הכרטיס:/)).toBeInTheDocument();
  expect(screen.getByText(/הוספת מוצר:/)).toBeInTheDocument();
});

test("כשאין תאריך למוצרים — נכתב שאין, ולא תאריך מומצא", async () => {
  getSupplierReport.mockResolvedValue({
    ...BASE,
    products: { total: 5, lastAddedAt: null, addedInRange: 0, withoutDate: 5 },
  });

  render(<SupplierReportRange token="tok" />);

  expect(await screen.findByText(/אין תאריך למוצרים הקיימים/)).toBeInTheDocument();
  expect(screen.getByText(/הם נוספו לפני שהמערכת התחילה לתעד/)).toBeInTheDocument();
});
