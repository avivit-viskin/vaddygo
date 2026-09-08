import { updateSubgroups } from "./groupsService";
import { api } from "./api";

/*
  updateSubgroups — שולח לשרת לכל קבוצה שם + סכום גבייה. הבדיקה מוודאת שהמרת
  הקלט (מהמסך) למבנה שהשרת מצפה לו נכונה: שם מנוקה, סכום ריק/לא-מספרי → null
  (השרת יתייחס לזה כ"סכום הקטגוריות הרגיל"), וסכום תקין הופך למספר.
*/
jest.mock("./api");

afterEach(() => jest.resetAllMocks());

test("ממיר שם+סכום למבנה { groups: [{ name, amount }] } שהשרת מצפה לו", async () => {
  api.put.mockResolvedValue({ id: 7, subgroups: [], subgroupAmounts: {} });

  await updateSubgroups(7, [
    { name: "  צהרון  ", amount: "350" },
    { name: "בוקר", amount: "" },
    { name: "צעירים", amount: "abc" },
    { name: "בכירים", amount: 500 },
  ]);

  expect(api.put).toHaveBeenCalledWith("/api/groups/7/subgroups", {
    groups: [
      { name: "צהרון", amount: 350 },
      { name: "בוקר", amount: null },
      { name: "צעירים", amount: null },
      { name: "בכירים", amount: 500 },
    ],
  });
});

test("רשימה ריקה/חסרה נשלחת כמערך ריק (בלי לזרוק)", async () => {
  api.put.mockResolvedValue({ id: 7, subgroups: [], subgroupAmounts: {} });

  await updateSubgroups(7, undefined);

  expect(api.put).toHaveBeenCalledWith("/api/groups/7/subgroups", { groups: [] });
});
