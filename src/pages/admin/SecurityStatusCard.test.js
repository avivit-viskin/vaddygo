import { render, screen } from "@testing-library/react";
import SecurityStatusCard from "./SecurityStatusCard";
import { getSecurityStatus } from "../../services/securityStatusService";

jest.mock("../../services/securityStatusService", () => ({
  getSecurityStatus: jest.fn(),
}));

/*
  המסך קיים כדי לענות על שאלה אחת: האם ההגנה שהוגדרה ב-Railway באמת פועלת.
  לכן הבדיקות מוודאות שהוא מבחין בין פעיל לכבוי — ולא רק מציג רשימה.
*/
beforeEach(() => jest.clearAllMocks());

test("הצפנה כבויה מוצגת ככבויה, עם ההסבר מה להגדיר", async () => {
  getSecurityStatus.mockResolvedValue({
    encryptionAtRest: false,
    strongJwtKey: true,
    productionCors: true,
    backupsEnabled: true,
    realPaymentProvider: false,
    lastBackupAt: null,
  });

  render(<SecurityStatusCard />);

  expect(await screen.findByText("הצפנת שדות רגישים")).toBeInTheDocument();
  expect(screen.getByText(/Encryption__Key/)).toBeInTheDocument();
  // שלוש הגנות פעילות, שתיים כבויות (הצפנה + סליקה)
  expect(screen.getAllByText("פעיל")).toHaveLength(3);
  expect(screen.getAllByText("כבוי")).toHaveLength(2);
});

test("הצפנה דלוקה מוצגת כפעילה", async () => {
  getSecurityStatus.mockResolvedValue({
    encryptionAtRest: true,
    strongJwtKey: true,
    productionCors: true,
    backupsEnabled: true,
    realPaymentProvider: false,
    lastBackupAt: "2026-08-17T09:00:00Z",
  });

  render(<SecurityStatusCard />);

  expect(
    await screen.findByText(/אלרגיות, כתובת וטלפוני הורים נשמרים מוצפנים/)
  ).toBeInTheDocument();
  expect(screen.getByText(/גיבוי אחרון:/)).toBeInTheDocument();
});

test("שגיאה מהשרת מוצגת ולא מפילה את המסך", async () => {
  getSecurityStatus.mockRejectedValue(new Error("אין הרשאה"));
  render(<SecurityStatusCard />);
  expect(await screen.findByText(/אין הרשאה/)).toBeInTheDocument();
});
