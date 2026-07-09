import {
  buildWhatsappReminderUrl,
  buildReminderMessage,
} from "./paymentsService";

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
