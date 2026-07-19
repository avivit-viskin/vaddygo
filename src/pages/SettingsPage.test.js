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

test("ברירת מחדל: כל ההתראות דלוקות", async () => {
  renderPage();
  // כרטיס קישורי התשלום נטען אסינכרונית — מחכים לו כדי לא לקבל אזהרת act
  await screen.findByLabelText(/תשלום בביט/);
  expect(screen.getByLabelText(/תזכורות תשלום/)).toBeChecked();
  expect(screen.getByLabelText(/התראות ימי הולדת/)).toBeChecked();
});

test("כיבוי תזכורות תשלום נשמר בהעדפות", async () => {
  renderPage();
  await screen.findByLabelText(/תשלום בביט/);
  await userEvent.click(screen.getByLabelText(/תזכורות תשלום/));
  expect(getNotificationPrefs().payments).toBe(false);
  expect(getNotificationPrefs().birthdays).toBe(true);
});
