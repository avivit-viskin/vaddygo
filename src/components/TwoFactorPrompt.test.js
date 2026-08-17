import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TwoFactorPrompt from "./TwoFactorPrompt";
import { verifyTwoFactor, resendTwoFactorCode } from "../services/authService";

jest.mock("../services/authService", () => ({
  verifyTwoFactor: jest.fn(),
  resendTwoFactorCode: jest.fn(),
}));

/*
  הסיכון האמיתי באימות דו-שלבי אינו שתוקף ייכנס — אלא שבעלת המערכת תינעל
  בחוץ ותאבד אמון. לכן הבדיקות כאן מתמקדות במסלולי החילוץ: מעבר לערוץ אחר,
  קוד גיבוי, וכישלון שלא מוחק את המסך.
*/
const challenge = {
  challengeId: "chal-1",
  channel: "email",
  sentTo: "a***@gmail.com",
  channels: [
    { key: "email", label: "מייל", target: "a***@gmail.com" },
    { key: "sms", label: "מסרון", target: "***1234" },
  ],
};

beforeEach(() => jest.clearAllMocks());

test("מציג לאן נשלח הקוד ומאמת אותו", async () => {
  verifyTwoFactor.mockResolvedValue({ token: "t" });
  const onSuccess = jest.fn();

  render(
    <TwoFactorPrompt challenge={challenge} onSuccess={onSuccess} onCancel={() => {}} />
  );

  expect(screen.getByText("a***@gmail.com")).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/הקוד שקיבלת/), "123456");
  await userEvent.click(screen.getByRole("button", { name: "כניסה" }));

  await waitFor(() =>
    expect(verifyTwoFactor).toHaveBeenCalledWith({
      challengeId: "chal-1",
      code: "123456",
      // מסומן כברירת מחדל — אחרת התכונה מעצבנת בכל כניסה ונכבית
      rememberDevice: true,
    })
  );
  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});

test("אפשר לבקש את הקוד בערוץ אחר בלי להתחיל התחברות מחדש", async () => {
  resendTwoFactorCode.mockResolvedValue({
    ...challenge,
    challengeId: "chal-2",
    channel: "sms",
    sentTo: "***1234",
  });

  render(
    <TwoFactorPrompt challenge={challenge} onSuccess={jest.fn()} onCancel={() => {}} />
  );

  await userEvent.click(screen.getByRole("button", { name: /שלחו לי במסרון/ }));

  expect(resendTwoFactorCode).toHaveBeenCalledWith({
    challengeId: "chal-1",
    channel: "sms",
  });
  // האתגר החדש מחליף את הקודם — אחרת האימות היה נשלח עם מזהה שכבר בוטל
  expect(await screen.findByText(/נשלח קוד חדש ל-\*\*\*1234/)).toBeInTheDocument();
});

test("הערוץ הפעיל אינו מוצע שוב כחלופה", () => {
  render(
    <TwoFactorPrompt challenge={challenge} onSuccess={jest.fn()} onCancel={() => {}} />
  );

  expect(screen.queryByRole("button", { name: /שלחו לי במייל/ })).toBeNull();
  expect(screen.getByRole("button", { name: /שליחה חוזרת/ })).toBeInTheDocument();
});

test("קוד שגוי מציג שגיאה ומשאיר את המסך פתוח לניסיון נוסף", async () => {
  verifyTwoFactor.mockRejectedValue(new Error("הקוד שגוי או שפג תוקפו"));
  const onSuccess = jest.fn();

  render(
    <TwoFactorPrompt challenge={challenge} onSuccess={onSuccess} onCancel={() => {}} />
  );

  await userEvent.type(screen.getByLabelText(/הקוד שקיבלת/), "000000");
  await userEvent.click(screen.getByRole("button", { name: "כניסה" }));

  expect(await screen.findByText(/הקוד שגוי/)).toBeInTheDocument();
  expect(onSuccess).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/הקוד שקיבלת/)).toBeInTheDocument();
});

test("קוד גיבוי נשלח באותו שדה — אין מסך נפרד לחפש ברגע לחוץ", async () => {
  verifyTwoFactor.mockResolvedValue({ token: "t" });

  render(
    <TwoFactorPrompt challenge={challenge} onSuccess={jest.fn()} onCancel={() => {}} />
  );

  await userEvent.type(screen.getByLabelText(/הקוד שקיבלת/), "4F7K-2QX9");
  await userEvent.click(screen.getByRole("button", { name: "כניסה" }));

  await waitFor(() =>
    expect(verifyTwoFactor).toHaveBeenCalledWith(
      expect.objectContaining({ code: "4F7K-2QX9" })
    )
  );
});
