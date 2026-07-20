const { test, expect } = require("@playwright/test");

/*
  צייד הקריסות (מחובר) — אוסף את כל קישורי הניווט באפליקציה (תפריט צדדי + ניווט
  תחתון + קישורים בעמוד), ונכנס לכל אחד כדי לוודא: העמוד נטען, מציג תוכן, מסך
  השגיאה לא הופיע, ואין קריסות JavaScript. כך תופסים דף שבור/קישור מקולקל בכל האתר.
  בטוח לחלוטין — רק ניווט (בלי לחיצה על כפתורי מחיקה/שליחה).
*/

test("כל קישורי הניווט מובילים לעמוד תקין ובלי קריסות", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });

  // פותחים את התפריט הצדדי כדי לאסוף גם את הקישורים שבתוכו
  await page
    .getByRole("button", { name: "תפריט" })
    .click()
    .catch(() => {});
  await page.waitForTimeout(300);

  // כל הקישורים הפנימיים (מתחילים ב-"/"), בלי כפילויות
  const hrefs = await page
    .locator("a[href^='/']")
    .evaluateAll((els) => [
      ...new Set(els.map((e) => e.getAttribute("href")).filter(Boolean)),
    ]);

  expect(hrefs.length, "לא נמצאו קישורי ניווט").toBeGreaterThan(2);

  const problems = [];
  for (const href of hrefs) {
    const crashes = [];
    const onErr = (e) => crashes.push(e.message);
    page.on("pageerror", onErr);

    const res = await page.goto(href, { waitUntil: "load" });
    const emptyRoot = await page.locator("#root").innerText().catch(() => "");
    const errorScreen = await page.getByText("משהו השתבש").count();

    if (!res || res.status() >= 400) problems.push(`${href}: HTTP ${res?.status()}`);
    if (!emptyRoot.trim()) problems.push(`${href}: דף ריק (לבן)`);
    if (errorScreen > 0) problems.push(`${href}: מסך שגיאה`);
    if (crashes.length) problems.push(`${href}: קריסה — ${crashes.join("; ")}`);

    page.off("pageerror", onErr);
  }

  expect(problems, `בעיות בעמודים:\n${problems.join("\n")}`).toEqual([]);
});
