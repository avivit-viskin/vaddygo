import {
  PRO_ENFORCED,
  isPro,
  isProFeature,
  isFeatureLocked,
} from "./plan";

const USER_KEY = "vaadygo.user";

afterEach(() => {
  localStorage.clear();
});

test("isPro — ברירת מחדל: לא מנוי (חינם)", () => {
  expect(isPro()).toBe(false);
  localStorage.setItem(USER_KEY, JSON.stringify({ username: "a", plan: "free" }));
  expect(isPro()).toBe(false);
});

test("isPro — מזהה מנוי פרו", () => {
  localStorage.setItem(USER_KEY, JSON.stringify({ username: "a", plan: "pro" }));
  expect(isPro()).toBe(true);
});

test("isProFeature — מזהה פיצ'רי פרו מהרשימה, ולא פיצ'רי ליבה", () => {
  expect(isProFeature("ai")).toBe(true);
  expect(isProFeature("bulkReminders")).toBe(true);
  expect(isProFeature("students")).toBe(false);
});

test("שלב א' בטוח: כל עוד ההבחנה כבויה — שום פיצ'ר לא נחסם, גם ללא מנוי", () => {
  expect(PRO_ENFORCED).toBe(false);
  expect(isFeatureLocked("ai")).toBe(false); // אפילו פיצ'ר פרו נשאר פתוח
  expect(isFeatureLocked("students")).toBe(false);
});
