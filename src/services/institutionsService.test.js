import {
  saveActiveOnboarding,
  getInstitutions,
  getActiveInstitution,
  setActiveInstitution,
  beginActivation,
  addInstitution,
  syncServerGroups,
  getActiveRole,
  isActiveReadOnly,
} from "./institutionsService";

/*
  טסטים לריבוי מוסדות (UI_SPEC ס' 3.5).
*/
beforeEach(() => {
  localStorage.clear();
});

test("הרשמה ראשונה יוצרת מוסד ראשי מופעל + מוסדות נוספים לא-מופעלים", () => {
  saveActiveOnboarding({
    ganName: "גן הפרחים",
    institutionType: "gan",
    extraCommitteeNames: ["גן הזית", "בית ספר יסודי"],
    childrenCount: "20",
  });

  const list = getInstitutions();
  expect(list).toHaveLength(3);

  const active = getActiveInstitution();
  expect(active.name).toBe("גן הפרחים");
  expect(active.activated).toBe(true);

  const extras = list.filter((i) => !i.activated);
  expect(extras.map((e) => e.name)).toEqual(["גן הזית", "בית ספר יסודי"]);
});

test("אי אפשר לעבור למוסד לא-מופעל", () => {
  saveActiveOnboarding({ ganName: "גן א", extraCommitteeNames: ["גן ב"] });
  const locked = getInstitutions().find((i) => !i.activated);

  expect(setActiveInstitution(locked.id)).toBe(false);
  // המוסד הפעיל לא השתנה
  expect(getActiveInstitution().name).toBe("גן א");
});

test("הפעלת מוסד נוסף: רכישה → הרשמה → הופך מופעל ופעיל", () => {
  saveActiveOnboarding({ ganName: "גן א", extraCommitteeNames: ["גן ב"] });
  const locked = getInstitutions().find((i) => !i.activated);

  // מסך הרכישה מפעיל את המוסד לצורך ההרשמה שלו
  beginActivation(locked.id);
  // ההרשמה של המוסד הנוסף מסתיימת
  saveActiveOnboarding({ ganName: "גן ב", extraCommitteeNames: [] });

  const nowActive = getActiveInstitution();
  expect(nowActive.id).toBe(locked.id);
  expect(nowActive.activated).toBe(true);
  expect(nowActive.name).toBe("גן ב");
  // עדיין שני מוסדות בסך הכל
  expect(getInstitutions()).toHaveLength(2);
});

test("הוספת מוסד חדש מוסיפה מוסד לא-מופעל לרשימה", () => {
  saveActiveOnboarding({ ganName: "גן א", extraCommitteeNames: [] });
  const id = addInstitution("גן הרימון");

  const list = getInstitutions();
  expect(list).toHaveLength(2);
  const added = list.find((i) => i.id === id);
  expect(added.name).toBe("גן הרימון");
  expect(added.activated).toBe(false);
  // המוסד הפעיל לא השתנה
  expect(getActiveInstitution().name).toBe("גן א");
});

test("syncServerGroups מוסיף גן מהשרת עם ההרשאה; 'צופה' → isActiveReadOnly", () => {
  syncServerGroups([{ id: 42, name: "גן שהוזמנתי אליו", role: "viewer" }]);
  const inst = getInstitutions().find((i) => i.serverGroupId === 42);
  expect(inst).toBeTruthy();
  expect(inst.role).toBe("viewer");

  expect(setActiveInstitution(inst.id)).toBe(true);
  expect(getActiveRole()).toBe("viewer");
  expect(isActiveReadOnly()).toBe(true);
});

test("גן בבעלות (manager) אינו לקריאה-בלבד", () => {
  syncServerGroups([{ id: 7, name: "הגן שלי", role: "manager" }]);
  const inst = getInstitutions().find((i) => i.serverGroupId === 7);
  setActiveInstitution(inst.id);
  expect(getActiveRole()).toBe("manager");
  expect(isActiveReadOnly()).toBe(false);
});

test("סנכרון חוזר מעדכן הרשאה של גן קיים (viewer → editor)", () => {
  syncServerGroups([{ id: 9, name: "גן", role: "viewer" }]);
  syncServerGroups([{ id: 9, name: "גן", role: "editor" }]);
  const list = getInstitutions().filter((i) => i.serverGroupId === 9);
  expect(list).toHaveLength(1); // לא נוצר כפל
  expect(list[0].role).toBe("editor");
});

test("מעבר בין שני מוסדות מופעלים טוען את נתוני ההרשמה של הפעיל", () => {
  saveActiveOnboarding({ ganName: "גן א", extraCommitteeNames: ["גן ב"] });
  const locked = getInstitutions().find((i) => !i.activated);
  beginActivation(locked.id);
  saveActiveOnboarding({ ganName: "גן ב", extraCommitteeNames: [] });

  // חוזרים למוסד הראשי
  const main = getInstitutions().find((i) => i.name === "גן א");
  expect(setActiveInstitution(main.id)).toBe(true);
  expect(getActiveInstitution().name).toBe("גן א");
  // נתוני ההרשמה של המוסד הפעיל נטענו למפתח המשותף
  expect(JSON.parse(localStorage.getItem("vaadygo.onboarding")).ganName).toBe("גן א");
});
