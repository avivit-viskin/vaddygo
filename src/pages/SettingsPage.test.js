import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "./SettingsPage";
import { getNotificationPrefs } from "../services/notificationPrefs";

afterEach(() => localStorage.clear());

test("ברירת מחדל: כל ההתראות דלוקות", async () => {
  render(<SettingsPage />);
  // כרטיס קישורי התשלום נטען אסינכרונית — מחכים לו כדי לא לקבל אזהרת act
  await screen.findByLabelText(/תשלום בביט/);
  expect(screen.getByLabelText(/תזכורות תשלום/)).toBeChecked();
  expect(screen.getByLabelText(/התראות ימי הולדת/)).toBeChecked();
});

test("כיבוי תזכורות תשלום נשמר בהעדפות", async () => {
  render(<SettingsPage />);
  await screen.findByLabelText(/תשלום בביט/);
  await userEvent.click(screen.getByLabelText(/תזכורות תשלום/));
  expect(getNotificationPrefs().payments).toBe(false);
  expect(getNotificationPrefs().birthdays).toBe(true);
});
