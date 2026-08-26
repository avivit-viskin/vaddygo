import {
  restoreOnboardingFromServer,
  getOnboarding,
  isOnboardingComplete,
  saveOnboarding,
} from "./onboardingService";
import { getGroups } from "./groupsService";
import { api } from "./api";

/*
  restoreOnboardingFromServer — אחרי ניקוי מטמון (החלפת משתמש) משחזר את הגדרת
  הגן מהשרת, שמחזיר אך ורק את הגנים של המשתמש המחובר (מאובטח).
*/
jest.mock("./groupsService");
jest.mock("./api", () => ({ api: { post: jest.fn(), get: jest.fn() } }));

afterEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

test("משחזר את הגדרת הגן מהשרת כשאין עותק מקומי", async () => {
  getGroups.mockResolvedValue([
    {
      id: 7,
      name: "גן הפרחים",
      city: "תל אביב",
      childrenCount: 22,
      staffCount: 3,
      subgroups: ["בוגרים"],
      categories: [{ id: 1, name: "הזנה", amountPerChild: 1200, installments: 1 }],
    },
  ]);

  const restored = await restoreOnboardingFromServer();

  expect(restored).toBe(true);
  expect(isOnboardingComplete()).toBe(true);
  const ob = getOnboarding();
  expect(ob.ganName).toBe("גן הפרחים");
  expect(ob.childrenCount).toBe("22");
  expect(ob.groupId).toBe(7);
});

test("משתמש בלי גן בשרת → לא משחזר (חוזר false, נשאר אשף)", async () => {
  getGroups.mockResolvedValue([]);

  const restored = await restoreOnboardingFromServer();

  expect(restored).toBe(false);
  expect(isOnboardingComplete()).toBe(false);
});

test("אם כבר יש הגדרה מקומית — לא פונה לשרת", async () => {
  localStorage.setItem("vaadygo.onboarding", JSON.stringify({ ganName: "קיים" }));

  const restored = await restoreOnboardingFromServer();

  expect(restored).toBe(true);
  expect(getGroups).not.toHaveBeenCalled();
});

/*
  באג שדווח בשימוש: "הוספתי מוסד חדש והפרו לא נפתח בו, ואין את ההתראה".
  הסיבה — הרשומה המקומית של מוסד חדש נוצרת בלי מצב המסלול, והיא התמלאה רק
  בטעינה הבאה של האפליקציה. עד אז המוסד נראה בלי פרו למרות שבשרת הכול פתוח.
*/
test("שמירת אשף מסנכרנת מיד את המוסדות, כדי שמצב הפרו יגיע בלי רענון", async () => {
  api.post.mockResolvedValue({ id: 7 });
  getGroups.mockResolvedValue([
    { id: 7, name: "גן חדש", isPro: true, isTrial: true, trialEndsAt: "2026-10-01T00:00:00Z" },
  ]);

  const result = await saveOnboarding({
    ganName: "גן חדש", city: "רעננה", childrenCount: 10, staffCount: 2,
    subgroups: [], categories: [],
  });

  expect(result.synced).toBe(true);
  // הסנכרון רץ מיד אחרי היצירה ולא ממתין לטעינה הבאה
  expect(getGroups).toHaveBeenCalled();

  const saved = JSON.parse(localStorage.getItem("vaadygo.institutions") || "[]");
  const created = saved.find((i) => i.serverGroupId === 7);
  expect(created?.isTrial).toBe(true);
  expect(created?.trialEndsAt).toBe("2026-10-01T00:00:00Z");
});
