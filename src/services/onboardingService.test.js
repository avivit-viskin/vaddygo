import {
  restoreOnboardingFromServer,
  getOnboarding,
  isOnboardingComplete,
} from "./onboardingService";
import { getGroups } from "./groupsService";

/*
  restoreOnboardingFromServer — אחרי ניקוי מטמון (החלפת משתמש) משחזר את הגדרת
  הגן מהשרת, שמחזיר אך ורק את הגנים של המשתמש המחובר (מאובטח).
*/
jest.mock("./groupsService");

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
