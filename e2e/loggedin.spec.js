const { test, expect } = require("@playwright/test");

/*
  בדיקות "מחובר" — הבוט נכנס עם חשבון-הבדיקה ועובר על העמודים הפנימיים, לבדוק
  שכל אחד נטען, מציג תוכן (לא דף לבן), לא מעיף חזרה למסך הכניסה, ולא קורס — כולל
  בדיקה שמסך השגיאה ("משהו השתבש") *לא* הופיע.

  אלה עמודים שנטענים גם לחשבון חדש (בלי הגדרת גן). זרימות שיוצרות נתונים (הוספת
  תלמיד, תשלום, ייבוא) יתווספו בהמשך — כולן על חשבון-הבדיקה בלבד.
*/
const INTERNAL_PAGES = [
  "/students",
  "/calendar",
  "/gifts",
  "/settings",
  "/onboarding",
];

for (const path of INTERNAL_PAGES) {
  test(`(מחובר) העמוד ${path} נטען, מוצג ובלי קריסות`, async ({ page }) => {
    const crashes = [];
    page.on("pageerror", (err) => crashes.push(err.message));

    const response = await page.goto(path, { waitUntil: "load" });
    expect(response.status(), `סטטוס HTTP של ${path}`).toBeLessThan(400);

    // ההתחברות עובדת — לא הועפנו למסך הכניסה
    await expect(page, `${path} העיף למסך הכניסה`).not.toHaveURL(/\/login/);

    // האפליקציה עלתה, ומסך השגיאה לא הופיע (כלומר לא הייתה קריסה שנתפסה)
    await expect(page.locator("#root")).not.toBeEmpty();
    await expect(
      page.getByText("משהו השתבש"),
      `מסך שגיאה הופיע ב-${path}`
    ).toHaveCount(0);

    // אין קריסות JavaScript שקטות
    expect(crashes, `קריסות JS בעמוד ${path}`).toEqual([]);
  });
}
