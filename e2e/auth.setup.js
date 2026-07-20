const { test: setup, expect } = require("@playwright/test");

/*
  auth.setup — מתחבר פעם אחת עם חשבון-הבדיקה הייעודי (דרך מסך הכניסה, כמו משתמשת
  אמיתית) ושומר את מצב ההתחברות לקובץ. שאר הבדיקות המחוברות משתמשות במצב הזה, בלי
  להתחבר שוב. פרטי החשבון מגיעים ממשתני הסביבה — לעולם לא כתובים בקוד.
*/
const AUTH_FILE = "e2e/.auth/bot.json";

setup("התחברות חשבון-הבדיקה ושמירת המצב", async ({ page }) => {
  const user = process.env.E2E_USER;
  const password = process.env.E2E_PASSWORD;
  expect(user, "חסר E2E_USER (פרטי חשבון-הבדיקה)").toBeTruthy();
  expect(password, "חסר E2E_PASSWORD").toBeTruthy();

  await page.goto("/login");
  await page.locator("#login-identifier").fill(user);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "כניסה" }).click();

  // כניסה מוצלחת → מנווטים החוצה ממסך הכניסה, ונשמר טוקן
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
  const token = await page.evaluate(() => localStorage.getItem("vaadygo.token"));
  expect(token, "לא נשמר טוקן אחרי הכניסה").toBeTruthy();

  await page.context().storageState({ path: AUTH_FILE });
});
