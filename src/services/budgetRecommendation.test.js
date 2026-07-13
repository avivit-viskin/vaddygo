import { computeBudgetRecommendation } from "./budgetRecommendation";

afterEach(() => localStorage.clear());

test("מחשב חלוקת תקציב לפי ילדים/צוות ותקציבי חגים", () => {
  localStorage.setItem(
    "vaadygo.onboarding",
    JSON.stringify({ childrenCount: "20", staffCount: "3" })
  );

  const rates = { staffPerPerson: 50, childBirthday: 20, endOfYearPerChild: 40, miscPercent: 10 };
  const { rows, total } = computeBudgetRecommendation({ "פסח|תשפ״ו": 500 }, rates);
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.amount]));

  expect(byKey.holidays).toBe(500);
  expect(byKey.staff).toBe(150); // 3 × 50
  expect(byKey.children).toBe(400); // 20 × 20
  expect(byKey.endOfYear).toBe(800); // 20 × 40
  expect(byKey.misc).toBe(185); // 10% מ-1850
  expect(total).toBe(2035); // 1850 + 185
});
