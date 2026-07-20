const { test, expect } = require("@playwright/test");

/*
  בדיקת חישובי כסף (מחובר) — הלב של מה שביקשנו: לוודא שהמספרים הכספיים נכונים.

  חשבון-הבדיקה מוגדר עם גן במספרים ידועים:
    2 קטגוריות: 100 ₪ + 50 ₪ לילד  ×  10 ילדים  =  יעד של 1,500 ₪.
  עוד לא נגבה כלום ולא הוצא כלום, ולכן:
    • "חוב פתוח" = כל היעד = 1,500 ₪
    • "יתרת הקופה" = 0 ₪
    • התקדמות = 0%
  אם מישהו ישבור את נוסחת החישוב — הבדיקה הזו תיפול.
*/

test("מסך הבית: היעד/החוב/היתרה מחושבים נכון (סכום קטגוריות × מספר ילדים)", async ({
  page,
}) => {
  const crashes = [];
  page.on("pageerror", (err) => crashes.push(err.message));

  await page.goto("/", { waitUntil: "load" });

  // הגן קיים — לא הועפנו לכניסה או לאשף ההרשמה
  await expect(page).not.toHaveURL(/\/(login|onboarding)/);

  // חוב פתוח = כל היעד (עוד לא נגבה): (100 + 50) × 10 = 1,500 ₪
  await expect(page.locator(".collection__amount--debt")).toHaveText("1,500 ₪");

  // יתרת הקופה = 0 (עוד לא נגבה ולא הוצא)
  await expect(page.locator(".collection__amount--positive")).toHaveText("0 ₪");

  // התקדמות הגבייה = 0%
  await expect(page.locator(".progress__text")).toHaveText("0% מהיעד נגבה");

  expect(crashes, "קריסות JS במסך הבית").toEqual([]);
});
