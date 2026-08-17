import { redactUrl } from "./monitoring";

/*
  הטוקנים בכתובות של VaddyGo הם סודות אמיתיים: קישור העריכה של ספק, הזמנה
  לגן, וקישור סקר. אם הם נשלחים לשירות ניטור חיצוני — מי שרואה אותם שם יכול
  להשתמש בהם. הבדיקות כאן נועלות את הניקוי.
*/
test("טוקן של ספק מוסתר מהכתובת", () => {
  expect(redactUrl("https://app.test/supplier/abc123def456")).toBe(
    "https://app.test/supplier/<redacted>"
  );
});

test("טוקן הזמנה וטוקן סקר מוסתרים גם הם", () => {
  expect(redactUrl("https://app.test/join/tok1")).toBe(
    "https://app.test/join/<redacted>"
  );
  expect(redactUrl("https://app.test/poll/tok2")).toBe(
    "https://app.test/poll/<redacted>"
  );
});

test("שאר הכתובת נשמרת — כולל פרמטרים ונתיב המשך", () => {
  expect(redactUrl("https://app.test/supplier/secret?tab=products")).toBe(
    "https://app.test/supplier/<redacted>?tab=products"
  );
  expect(redactUrl("https://app.test/supplier/secret/extra")).toBe(
    "https://app.test/supplier/<redacted>/extra"
  );
});

test("כתובת בלי סוד אינה משתנה", () => {
  expect(redactUrl("https://app.test/students")).toBe(
    "https://app.test/students"
  );
});

test("קלט לא תקין אינו מפיל את הדיווח", () => {
  expect(redactUrl(undefined)).toBe(undefined);
  expect(redactUrl("")).toBe("");
});
