import {
  PRO_ENFORCED,
  isPro,
  isProFeature,
  isFeatureLocked,
  isRouteLocked,
  grantProLocally,
} from "./plan";
import { setActiveInstitution } from "./institutionsService";

const INSTITUTIONS_KEY = "vaadygo.institutions";

// שני גנים מופעלים ברשימת המוסדות (כדי לבדוק בידוד פרו לפי גן)
function setupTwoGans() {
  localStorage.setItem(
    INSTITUTIONS_KEY,
    JSON.stringify([
      { id: "gan-a", name: "גן א", type: "gan", activated: true, serverGroupId: 1 },
      { id: "gan-b", name: "גן ב", type: "gan", activated: true, serverGroupId: 2 },
    ])
  );
}

afterEach(() => {
  localStorage.clear();
});

test("isPro — ברירת מחדל: לא מנוי (חינם)", () => {
  expect(isPro()).toBe(false);
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

test("grantProLocally — פותח פרו לגן הפעיל (שום פיצ'ר/עמוד פרו לא חסום)", () => {
  grantProLocally();
  expect(isPro()).toBe(true);
  expect(isFeatureLocked("ai")).toBe(false);
  expect(isRouteLocked("/assistant")).toBe(false);
});

test("פרו לכל גן בנפרד — פתיחה בגן אחד לא מדליקה פרו בגן אחר", () => {
  setupTwoGans();

  setActiveInstitution("gan-a");
  grantProLocally();
  expect(isPro()).toBe(true); // גן א נפתח

  setActiveInstitution("gan-b");
  expect(isPro()).toBe(false); // גן ב עדיין חינם — אין דליפה
  expect(isFeatureLocked("ai")).toBe(true);

  setActiveInstitution("gan-a");
  expect(isPro()).toBe(true); // חוזרים לגן א — עדיין פרו
});

test("פתיחת פרו נשמרת גם אחרי כניסה מחדש (כשהשרת לא מחזיר plan)", () => {
  grantProLocally();
  // כניסה חוזרת: המשתמש נטען מחדש בלי plan — הפתיחה (לפי גן) עדיין תקפה
  expect(isPro()).toBe(true);
});

test("isRouteLocked — עמוד פרו חסום ללא מנוי; עמוד ליבה תמיד פתוח", () => {
  expect(isRouteLocked("/assistant")).toBe(true);
  expect(isRouteLocked("/students")).toBe(false);
});
