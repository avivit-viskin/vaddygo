import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProTestControl from "./ProTestControl";
import { isPro } from "../../services/plan";
import { getActiveInstitution } from "../../services/institutionsService";

jest.mock("../../services/institutionsService", () => ({
  getActiveInstitution: jest.fn(),
}));

/*
  המתג נועד לבדיקות של המנהלת, ולכן הדבר הקריטי הוא שהוא פועל על **המוסד
  הפעיל בלבד** ושהמצב באמת משתנה — בלי לגעת בשרת.
*/
beforeEach(() => {
  localStorage.clear();
  getActiveInstitution.mockReturnValue({ id: "inst-1", name: "רעות בדיקת הרשאות" });
});

test("מציג את שם המוסד הפעיל ואת המצב הנעול כברירת מחדל", () => {
  render(<ProTestControl />);

  expect(screen.getAllByText("רעות בדיקת הרשאות").length).toBeGreaterThan(0);
  expect(screen.getByText("פרו נעול")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "פתיחת פרו במוסד הזה" })
  ).toBeInTheDocument();
});

test("פתיחה ונעילה משנות את המצב בפועל", () => {
  render(<ProTestControl />);

  userEvent.click(screen.getByRole("button", { name: "פתיחת פרו במוסד הזה" }));
  expect(screen.getByText("פרו פתוח")).toBeInTheDocument();
  expect(isPro()).toBe(true);

  userEvent.click(screen.getByRole("button", { name: "נעילת פרו במוסד הזה" }));
  expect(screen.getByText("פרו נעול")).toBeInTheDocument();
  expect(isPro()).toBe(false);
});

test("פתיחה נוגעת רק למוסד הפעיל — מוסד אחר נשאר נעול", () => {
  render(<ProTestControl />);
  userEvent.click(screen.getByRole("button", { name: "פתיחת פרו במוסד הזה" }));
  expect(isPro()).toBe(true);

  // מחליפים למוסד אחר — הפרו לא "עובר" איתו
  getActiveInstitution.mockReturnValue({ id: "inst-2", name: "גן אחר" });
  expect(isPro()).toBe(false);
});
