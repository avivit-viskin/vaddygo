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

  // מבטלים את "ציוד" בבורר (צ'קבוקס עם השם והסכום)
  await userEvent.click(screen.getByLabelText(/ציוד — /));

  // "ציוד" ירד מפירוט הדוח; "מתנות" נשאר
  expect(screen.queryByText("ציוד")).not.toBeInTheDocument();
  expect(screen.getByText("מתנות")).toBeInTheDocument();
});
