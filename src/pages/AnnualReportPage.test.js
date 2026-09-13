import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import AnnualReportPage from "./AnnualReportPage";

jest.mock("../services/dashboardService", () => ({
  loadDashboard: () =>
    Promise.resolve({
      ganName: "גן הרימון",
      year: 2026,
      childrenCount: 22,
      collectionTarget: 37400,
      collectedTotal: 20000,
      openDebt: 17400,
      boxBalance: 12000,
      progressPercent: 53,
      byCategory: [
        { name: "מתנות", targetAmount: 10000, collectedAmount: 6000, spentAmount: 8000 },
        { name: "ציוד", targetAmount: 0, collectedAmount: 0, spentAmount: 2000 },
      ],
      byPaymentMethod: [{ method: "bit", amount: 8000 }],
      fromServer: true,
    }),
}));

jest.mock("../services/expensesService", () => ({
  getExpenses: () =>
    Promise.resolve([
      { id: 1, category: "מתנות", description: "מגש פירות", amount: 200, date: "2026-01-05", method: "cash" },
      { id: 2, category: "מתנות", description: "בלונים", amount: 7800, date: "2026-01-06", method: "cash" },
      { id: 3, category: "ציוד", description: "צבעים", amount: 2000, date: "2026-02-01", method: "cash" },
    ]),
}));

test("מציג דוח שנתי עם שם הגן, סכומי הגבייה וההוצאות", async () => {
  render(
    <MemoryRouter>
      <AnnualReportPage />
    </MemoryRouter>
  );

  expect(await screen.findByText(/דוח שנתי להורים/)).toBeInTheDocument();
  expect(screen.getByText("גן הרימון")).toBeInTheDocument();
  // נגבה 20,000, יעד 37,400, סה"כ הוצאות 8,000
  expect(screen.getAllByText(/20,000/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/37,400/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/8,000/).length).toBeGreaterThan(0);
  // קטגוריית ההוצאה מופיעה
  expect(screen.getByText("מתנות")).toBeInTheDocument();
  // ופירוט ההוצאה עצמה (הפריט בתוך הקטגוריה) מופיע בדוח
  expect(await screen.findByText("מגש פירות")).toBeInTheDocument();
  expect(screen.getByText("בלונים")).toBeInTheDocument();
});

test("אפשר לבחור אילו קטגוריות הוצאה יופיעו — ביטול קטגוריה מסיר אותה מהדוח", async () => {
  render(
    <MemoryRouter>
      <AnnualReportPage />
    </MemoryRouter>
  );
  await screen.findByText("גן הרימון");

  // שתי קטגוריות ההוצאה מופיעות בפירוט
  expect(screen.getByText("מתנות")).toBeInTheDocument();
  expect(screen.getByText("ציוד")).toBeInTheDocument();

  // הפריט של "ציוד" מופיע לפני הביטול
  expect(await screen.findByText("צבעים")).toBeInTheDocument();

  // מבטלים את "ציוד" בבורר (צ'קבוקס עם השם והסכום)
  await userEvent.click(screen.getByLabelText(/ציוד — /));

  // "ציוד" והפריט שלו ירדו מהדוח; "מתנות" והפריט שלו נשארו
  expect(screen.queryByText("ציוד")).not.toBeInTheDocument();
  expect(screen.queryByText("צבעים")).not.toBeInTheDocument();
  expect(screen.getByText("מתנות")).toBeInTheDocument();
  expect(screen.getByText("מגש פירות")).toBeInTheDocument();
});
