import {
  buildWhatsappReminderUrl,
  buildWhatsappShareUrl,
  buildReminderMessage,
  buildBulkPaymentRequestMessage,
  getPaymentSummary,
  getAllPaymentSummaries,
  amountPaidSoFar,
  amountRemaining,
  isCategoryFullyPaid,
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

describe("buildWhatsappShareUrl", () => {
  test("פותח וואטסאפ בלי נמען מוגדר, עם ההודעה מוכנה לבחירת נמען", () => {
    const url = buildWhatsappShareUrl("הודעה לכל ההורים");
    expect(url).toBe(`https://wa.me/?text=${encodeURIComponent("הודעה לכל ההורים")}`);
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

describe("buildBulkPaymentRequestMessage", () => {
  const links = { bit: "050-1234567", paybox: "https://paybox.example/g" };

  test("כולל את הנוסח הידידותי ואת שני קישורי התשלום מההגדרות", () => {
    const msg = buildBulkPaymentRequestMessage("גן כוכב", links);
    expect(msg).toContain("נותר תשלום");
    expect(msg).toContain("לתשלום בביט למספר: 050-1234567");
    expect(msg).toContain(links.paybox);
  });

  test("רק ביט מוגדר — רק קישור הביט נכנס", () => {
    const msg = buildBulkPaymentRequestMessage("גני", { bit: links.bit, paybox: "" });
    expect(msg).toContain(links.bit);
    expect(msg).not.toContain(links.paybox);
  });

  test("בלי קישורים מוגדרים — נוסח ההודעה בלבד (בלי שורות קישור)", () => {
    const msg = buildBulkPaymentRequestMessage("גן כוכב", { bit: "", paybox: "" });
    expect(msg).not.toContain("לתשלום בביט");
    expect(msg).not.toContain("פייבוקס");
    expect(msg).toContain("נותר תשלום");
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

describe("getAllPaymentSummaries", () => {
  test("מקבץ את השורות לפי תלמיד ומחזיר סיכום לכל אחד (בקשה אחת)", async () => {
    api.get.mockResolvedValueOnce([
      { studentId: 1, categoryName: "הזנה", amount: 1200, cashAmount: 1200, isPaid: true },
      { studentId: 1, categoryName: "ועד", amount: 500, cashAmount: 500, isPaid: true },
      { studentId: 2, categoryName: "הזנה", amount: 1200, cashAmount: 0, isPaid: false },
      { studentId: 2, categoryName: "ועד", amount: 500, cashAmount: 500, isPaid: true },
    ]);
    const summaries = await getAllPaymentSummaries();
    const byId = Object.fromEntries(summaries.map((s) => [s.studentId, s]));
    expect(api.get).toHaveBeenCalledWith("/api/payment-summaries");
    expect(byId[1].allPaid).toBe(true);
    expect(byId[1].paidCount).toBe(2);
    expect(byId[2].hasUnpaid).toBe(true);
    expect(byId[2].paidCount).toBe(1);
  });
});

describe("תשלום באשראי (cardAmount) נספר בחישוב", () => {
  test("תשלום מלא באשראי — הקטגוריה נחשבת שולמה ואין חוב", () => {
    const p = { amount: 1200, cardAmount: 1200 };
    expect(amountPaidSoFar(p)).toBe(1200);
    expect(isCategoryFullyPaid(p)).toBe(true);
    expect(amountRemaining(p)).toBe(0);
  });

  test("תשלום חלקי באשראי (900 מתוך 1200) — עדיין חוב פתוח של 300", () => {
    const p = { amount: 1200, cardAmount: 900 };
    expect(isCategoryFullyPaid(p)).toBe(false);
    expect(amountRemaining(p)).toBe(300);
  });

  test("אשראי מצטרף לשאר האמצעים בסכום ה'שולם'", () => {
    const p = { amount: 1200, cashAmount: 300, cardAmount: 900 };
    expect(amountPaidSoFar(p)).toBe(1200);
    expect(isCategoryFullyPaid(p)).toBe(true);
  });
});
