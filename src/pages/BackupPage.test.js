import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BackupPage from "./BackupPage";

jest.mock("../services/dashboardService", () => ({
  loadDashboard: () =>
    Promise.resolve({
      ganName: "גן הרימון",
      year: 2026,
      childrenCount: 22,
      collectedTotal: 20000,
      boxBalance: 12000,
      byCategory: [{ name: "מתנות", spentAmount: 8000 }],
    }),
}));

afterEach(() => localStorage.clear());

test("מציג כלי גיבוי, וללא סיכומים שמורים — הודעת ריק להשוואה", async () => {
  render(
    <MemoryRouter>
      <BackupPage />
    </MemoryRouter>
  );

  expect(await screen.findByText(/הורדת גיבוי מלא/)).toBeInTheDocument();
  expect(screen.getByText(/עדיין לא שמרנו סיכום שנה/)).toBeInTheDocument();
});
