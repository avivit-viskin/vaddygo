const { test, expect } = require("@playwright/test");
const { deleteAllStudents } = require("./helpers");

/*
  זרימות מלאות (מחובר) — הבוט מבצע פעולות אמיתיות כמו משתמשת, ומוודא שהן עובדות
  מקצה לקצה. הכל על חשבון-הבדיקה בלבד, ומנקה אחרי עצמו כדי להיות חוזר.
*/

const FIRST = "בוטי";
const LAST = "אוטומציה";
const FULL = `${FIRST} ${LAST}`;

test.beforeEach(async ({ request }) => {
  // נקודת התחלה נקייה — בלי תלמידים קודמים שנשארו מריצה שנפלה
  await deleteAllStudents(request);
});

test("הוספת תלמיד → מופיע ברשימה → מחיקה → נעלם", async ({ page, request }) => {
  const crashes = [];
  page.on("pageerror", (err) => crashes.push(err.message));

  await page.goto("/students", { waitUntil: "load" });

  // הוספה
  await page.getByRole("button", { name: "+ הוספת תלמיד" }).click();
  await page.locator("#student-first-name").fill(FIRST);
  await page.locator("#student-last-name").fill(LAST);
  await page.locator("#student-parent-phone").fill("0500000000");
  await page.getByRole("button", { name: "שמירה" }).click();

  // מופיע ברשימה
  await expect(page.getByText(FULL)).toBeVisible();

  // מחיקה — כפתור המחיקה בכרטיס, ואז אישור בדיאלוג
  await page.getByRole("button", { name: "מחיקה" }).first().click();
  await page.getByRole("button", { name: "כן, למחוק" }).click();

  // נעלם
  await expect(page.getByText(FULL)).toHaveCount(0);

  expect(crashes, "קריסות JS בזרימת התלמיד").toEqual([]);

  // ניקוי ביטחון (אם המחיקה ב-UI לא הספיקה מסיבה כלשהי)
  await deleteAllStudents(request);
});
