// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/*
  playwright.config.js — הגדרות בוט הבדיקות (E2E) של VaddyGo.

  הבוט חי בתיקייה e2e/ ורץ בנפרד לגמרי מבדיקות היחידה (jest) של האפליקציה —
  jest מסתכל רק בתוך src/, אז אין ביניהם התנגשות. כתובת האתר נלקחת ממשתנה הסביבה
  E2E_BASE_URL, וברירת המחדל היא האתר החי. הבוט לא נבנה לתוך האפליקציה (devDependency).
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
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
