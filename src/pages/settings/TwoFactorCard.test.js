import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TwoFactorCard from "./TwoFactorCard";
import {
  getTwoFactorStatus,
  startTwoFactorSetup,
  enableTwoFactor,
} from "../../services/twoFactorService";

jest.mock("../../services/twoFactorService", () => ({
  getTwoFactorStatus: jest.fn(),
  startTwoFactorSetup: jest.fn(),
  enableTwoFactor: jest.fn(),
  disableTwoFactor: jest.fn(),
  regenerateBackupCodes: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

const OFF = {
  enabled: false,
  channel: "email",
  phone: null,
  smsAvailable: false,
  backupCodesRemaining: 0,
  trustedDevices: 0,
};

test("כשאין ספק SMS — האפשרות מושבתת ומסומנת ככזו", async () => {
  getTwoFactorStatus.mockResolvedValue(OFF);

  render(<TwoFactorCard />);

  const smsButton = await screen.findByRole("button", { name: /קוד ב-SMS/ });
  // הבטחה לערוץ שלא יגיע גרועה מלא להציע אותו — לכן מושבת ומסומן
  expect(smsButton).toBeDisabled();
  expect(smsButton).toHaveTextContent("לא זמין כרגע");
});

test("כשיש ספק SMS — האפשרות נפתחת ומבקשת מספר טלפון", async () => {
  getTwoFactorStatus.mockResolvedValue({ ...OFF, smsAvailable: true });

  render(<TwoFactorCard />);

  await userEvent.click(await screen.findByRole("button", { name: /קוד ב-SMS/ }));
  expect(screen.getByLabelText(/מספר הנייד/)).toBeInTheDocument();
});

test("הפעלה מציגה את קודי הגיבוי עם אזהרה שהם מוצגים פעם אחת", async () => {
  getTwoFactorStatus.mockResolvedValue(OFF);
  startTwoFactorSetup.mockResolvedValue({
    challengeId: "c1",
    channel: "email",
    sentTo: "a***@gmail.com",
    channels: [],
  });
  enableTwoFactor.mockResolvedValue({ codes: ["4F7K-2QX9", "8HJM-3PRT"] });

  render(<TwoFactorCard />);

  await userEvent.click(await screen.findByRole("button", { name: "הפעלת האימות" }));
  await userEvent.type(await screen.findByLabelText(/הקוד שקיבלת/), "123456");
  await userEvent.click(screen.getByRole("button", { name: "אישור והפעלה" }));

  // בלי הקודים האלה, תקלה בתיבת המייל נועלת את בעלת המערכת בחוץ לצמיתות
  expect(await screen.findByText("4F7K-2QX9")).toBeInTheDocument();
  expect(screen.getByText("8HJM-3PRT")).toBeInTheDocument();
  expect(screen.getByText(/מוצגים פעם אחת/)).toBeInTheDocument();
});

test("כשהאימות פעיל — מוצג מצב, מספר קודי הגיבוי, ופעולות שדורשות סיסמה", async () => {
  getTwoFactorStatus.mockResolvedValue({
    enabled: true,
    channel: "email",
    phone: null,
    smsAvailable: false,
    backupCodesRemaining: 7,
    trustedDevices: 2,
  });

  render(<TwoFactorCard />);

  expect(await screen.findByText("פעיל")).toBeInTheDocument();
  expect(screen.getByText("7")).toBeInTheDocument();
  // מסך שנשאר פתוח לרגע לא יספיק כדי לפרק את ההגנה
  expect(screen.getByLabelText(/הסיסמה שלך/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "כיבוי האימות" })).toBeInTheDocument();
});
