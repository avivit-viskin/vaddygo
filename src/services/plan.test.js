import {
  PRO_ENFORCED,
  isPro,
  isProFeature,
  isFeatureLocked,
  isRouteLocked,
  grantProLocally,
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

test("אכיפת פרו מופעלת: פיצ'ר פרו חסום ללא מנוי, פיצ'ר ליבה פתוח", () => {
  expect(PRO_ENFORCED).toBe(true);
  expect(isFeatureLocked("ai")).toBe(true); // פרו + לא מנוי → חסום
  expect(isFeatureLocked("students")).toBe(false); // ליבה → פתוח תמיד
});

test("מנוי פרו — שום פיצ'ר לא חסום", () => {
  localStorage.setItem(USER_KEY, JSON.stringify({ username: "a", plan: "pro" }));
  expect(isFeatureLocked("ai")).toBe(false);
});

test("isRouteLocked — עמוד פרו חסום ללא מנוי, פתוח למנוי; עמוד ליבה תמיד פתוח", () => {
  expect(isRouteLocked("/assistant")).toBe(true);
  expect(isRouteLocked("/students")).toBe(false);
  localStorage.setItem(USER_KEY, JSON.stringify({ username: "a", plan: "pro" }));
  expect(isRouteLocked("/assistant")).toBe(false);
});

test("grantProLocally — הופך את המשתמשת למנויה (pro) במכשיר", () => {
  localStorage.setItem(USER_KEY, JSON.stringify({ username: "a", plan: "free" }));
  grantProLocally();
  expect(isPro()).toBe(true);
});
