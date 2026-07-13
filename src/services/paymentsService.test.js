import {
  buildWhatsappReminderUrl,
  buildReminderMessage,
  getPaymentSummary,
} from "./paymentsService";
import { api } from "./api";

jest.mock("./api", () => ({ api: { get: jest.fn() } }));

/* בדיקות יחידה לבוני הקישור וההודעה של תזכורת הוואטסאפ (בלי רשת). */

describe("buildWhatsappReminderUrl", () => {
  test("ממיר טלפון ישראלי לפורמט בינלאומי בלי אפס מוביל", () => {
    const url = buildWhatsappReminderUrl("050-1112223", "היי");
    expect(url).toContain("https://wa.me/972501112223?text=");
  });

  test("מקודד את ההודעה בתוך ה-URL", () => {
    const url = buildWhatsappReminderUrl("0501112223", "שלום וברכה");
    expect(url).toContain(encodeURIComponent("שלום וברכה"));
  });
});

describe("buildReminderMessage", () => {
  test("מפרט את הקטגוריות שטרם שולמו ומסכם את הסכום הכולל", () => {
    const message = buildReminderMessage("הילי לוי", [
      { categoryName: "הזנה", amount: 1200 },
      { categoryName: "דמי ועד", amount: 500 },
    ]);

    expect(message).toContain("הילי לוי");
    expect(message).toContain("הזנה");
    expect(message).toContain("דמי ועד");
    expect(message).toContain("1,700 ₪"); // 1200 + 500
  });
});

describe("getPaymentSummary", () => {
  test("קטגוריה בלי יעד סכום שלא סומנה — נחשבת 'טרם שולם' (לא נספרת אוטומטית כשולמה)", async () => {
    api.get.mockResolvedValueOnce([
      { collectionCategoryId: 1, categoryName: "ועד", amount: 0, isPaid: false },
    ]);
    const summary = await getPaymentSummary(7);
    expect(summary.hasUnpaid).toBe(true);
    expect(summary.paidCount).toBe(0);
  });

  test("קטגוריה בלי יעד סכום שסומנה כשולמה — נספרת כשולמה", async () => {
    api.get.mockResolvedValueOnce([
      { collectionCategoryId: 1, categoryName: "ועד", amount: 0, isPaid: true },
    ]);
    const summary = await getPaymentSummary(8);
    expect(summary.hasUnpaid).toBe(false);
    expect(summary.allPaid).toBe(true);
  });

  test("קטגוריה עם יעד סכום — 'שולמה' רק כשסכום האמצעים מכסה את היעד, גם אם isPaid=true", async () => {
    api.get.mockResolvedValueOnce([
      { collectionCategoryId: 1, categoryName: "הזנה", amount: 1200, cashAmount: 1200, isPaid: true },
      { collectionCategoryId: 2, categoryName: "טיולים", amount: 300, cashAmount: 0, isPaid: true },
    ]);
    const summary = await getPaymentSummary(9);
    expect(summary.hasUnpaid).toBe(true); // טיולים לא כוסתה למרות isPaid
    expect(summary.paidCount).toBe(1);
  });
});
