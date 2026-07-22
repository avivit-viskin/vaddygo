import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./SettingsPage";
import { getNotificationPrefs } from "../services/notificationPrefs";

afterEach(() => localStorage.clear());

/* המסך מכיל כרטיס מחיקת חשבון שמנווט — עוטפים ב-Router כמו באפליקציה */
function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
}

/* ההגדרות בנויות כתפריט — קודם פותחים את נושא "התראות" מהתפריט */
async function openNotifications() {
  await userEvent.click(screen.getByRole("button", { name: /התראות/ }));
}

test("ברירת מחדל: כל ההתראות דלוקות", async () => {
  renderPage();
  await openNotifications();
  expect(screen.getByLabelText(/תזכורות תשלום/)).toBeChecked();
  expect(screen.getByLabelText(/התראות ימי הולדת/)).toBeChecked();
});

test("כיבוי תזכורות תשלום נשמר בהעדפות", async () => {
  renderPage();
  await openNotifications();
  await userEvent.click(screen.getByLabelText(/תזכורות תשלום/));
  expect(getNotificationPrefs().payments).toBe(false);
  expect(getNotificationPrefs().birthdays).toBe(true);
});

test("מסך ההגדרות פותח כתפריט קצר של נושאים", () => {
  renderPage();
  expect(screen.getByRole("button", { name: /חברי ועד והרשאות/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /תשלומים/ })).toBeInTheDocument();
  // התוכן עצמו (תיבות הסימון) מוצג רק אחרי כניסה לנושא
  expect(screen.queryByLabelText(/תזכורות תשלום/)).not.toBeInTheDocument();
});
