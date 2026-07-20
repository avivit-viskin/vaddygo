const { test, expect } = require("@playwright/test");

/*
  בדיקת עשן — הלבנה הראשונה של בוט הבדיקות (שלב 0).

  נכנסת לכל אחד מהעמודים הציבוריים ובודקת שלושה דברים שהם הבסיס של "האתר בריא":
    1. השרת מחזיר את העמוד (סטטוס תקין).
    2. האפליקציה עלתה ומציגה תוכן — כלומר לא "דף לבן".
    3. אין קריסות JavaScript ברקע (uncaught errors).

  זרימות שדורשות התחברות (הוספת תלמיד, תשלומים, ייבוא...) יתווספו בשלב 1, עם
  חשבון-בדיקה ייעודי — כדי לא לגעת בנתונים אמיתיים.
*/

// עמודים שאפשר לבדוק בלי להתחבר
const PUBLIC_PAGES = ["/login", "/welcome", "/register"];

for (const path of PUBLIC_PAGES) {
  test(`העמוד ${path} נטען, מציג תוכן, ובלי קריסות JS`, async ({ page }) => {
    const crashes = [];
    page.on("pageerror", (err) => crashes.push(err.message));

    const response = await page.goto(path, { waitUntil: "load" });

    // 1. השרת החזיר את העמוד
    expect(response, `לא התקבלה תשובה עבור ${path}`).not.toBeNull();
    expect(response.status(), `סטטוס HTTP של ${path}`).toBeLessThan(400);

    // 2. האפליקציה עלתה — יש תוכן בשורש (לא דף לבן)
    await expect(page.locator("#root")).not.toBeEmpty();

    // 3. אין קריסות JavaScript שקטות
    expect(crashes, `קריסות JS בעמוד ${path}`).toEqual([]);
  });
}

test("כניסה לכתובת לא-מוכרת מפנה למסך כניסה/פתיחה (לא קורסת)", async ({ page }) => {
  const crashes = [];
  page.on("pageerror", (err) => crashes.push(err.message));

  await page.goto("/some-unknown-page", { waitUntil: "load" });
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page).toHaveURL(/\/(login|welcome)/);
  expect(crashes, "קריסות JS בניתוב לכתובת לא-מוכרת").toEqual([]);
});
