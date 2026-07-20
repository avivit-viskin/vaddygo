// @ts-check
require("dotenv").config({ path: "e2e/.env" });
const { defineConfig, devices } = require("@playwright/test");

/*
  playwright.config.js — הגדרות בוט הבדיקות (E2E) של VaddyGo.

  הבוט חי בתיקייה e2e/ ורץ בנפרד לגמרי מבדיקות היחידה (jest) — jest מסתכל רק בתוך
  src/. כתובת האתר נלקחת מ-E2E_BASE_URL (ברירת מחדל: האתר החי). פרטי חשבון-הבדיקה
  (E2E_USER/E2E_PASSWORD) מגיעים מ-e2e/.env מקומית, ומ-GitHub Secrets ב-CI — לעולם
  לא בקוד.

  שלושה "פרויקטים":
    • setup    — מתחבר פעם אחת עם חשבון-הבדיקה ושומר את מצב ההתחברות.
    • public   — בדיקות בעמודים הציבוריים (בלי התחברות).
    • loggedin — בדיקות בעמודים הפנימיים, משתמש במצב ההתחברות שנשמר.
*/
module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 60_000, // סבלני ל"התעוררות" איטית של השרת בטעינה הראשונה
  expect: { timeout: 15_000 },
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://vaddygo-production.up.railway.app",
    headless: true,
    locale: "he-IL",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.js/ },
    {
      name: "public",
      testMatch: /smoke\.spec\.js/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "loggedin",
      testMatch: /loggedin\.spec\.js/,
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/bot.json" },
      dependencies: ["setup"],
    },
  ],
});
