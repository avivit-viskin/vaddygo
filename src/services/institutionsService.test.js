import {
  saveActiveOnboarding,
  getInstitutions,
  getActiveInstitution,
  getActiveServerGroupId,
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

test("מירר: גן שכבר אינו ברשימת השרת מוסר מהמחליף", () => {
  syncServerGroups([
    { id: 10, name: "גן א", role: "manager" },
    { id: 20, name: "ארנב", role: "viewer" },
  ]);
  expect(getInstitutions().filter((i) => i.serverGroupId != null)).toHaveLength(2);

  syncServerGroups([{ id: 10, name: "גן א", role: "manager" }]); // "ארנב" נעלם מהשרת
  const server = getInstitutions().filter((i) => i.serverGroupId != null);
  expect(server).toHaveLength(1);
  expect(server[0].serverGroupId).toBe(10);
});

test("מירר: רשימת שרת ריקה לא מוחקת (הגנה מכשל זמני)", () => {
  syncServerGroups([{ id: 10, name: "גן א", role: "manager" }]);
  syncServerGroups([]);
  expect(getInstitutions().filter((i) => i.serverGroupId != null)).toHaveLength(1);
});

test("ריבוי גנים: הגן הפעיל נשמר אחרי סנכרון חוזר (רענון)", () => {
  syncServerGroups([
    { id: 10, name: "גן A", role: "manager" },
    { id: 20, name: "גן B", role: "manager" },
  ]);
  const a = getInstitutions().find((i) => i.serverGroupId === 10);
  setActiveInstitution(a.id);
  expect(getActiveServerGroupId()).toBe(10);

  // "רענון" — סנכרון חוזר עם אותם הגנים
  syncServerGroups([
    { id: 10, name: "גן A", role: "manager" },
    { id: 20, name: "גן B", role: "manager" },
  ]);
  expect(getActiveServerGroupId()).toBe(10); // עדיין A
});

test("onboarding (בלי serverGroupId) + סנכרון — לא נוצר גן כפול, וה-serverGroupId מתמלא", () => {
  // אשף ההרשמה יצר את המוסד לפני שהשרת החזיר id → serverGroupId חסר
  saveActiveOnboarding({ ganName: "גן A", extraCommitteeNames: [] });
  expect(getActiveServerGroupId()).toBeNull();

  // הסנכרון מהשרת מחזיר את אותו גן עם id=10
  syncServerGroups([{ id: 10, name: "גן A", role: "manager" }]);

  const gansA = getInstitutions().filter((i) => i.name === "גן A");
  expect(gansA).toHaveLength(1); // לא כפילות!
  expect(getActiveServerGroupId()).toBe(10); // הגן הפעיל קיבל serverGroupId
});

test("אם הגן הפעיל הוסר בסנכרון — עוברים לגן תקף", () => {
  syncServerGroups([
    { id: 10, name: "גן א", role: "manager" },
    { id: 20, name: "ארנב", role: "viewer" },
  ]);
  const rabbit = getInstitutions().find((i) => i.serverGroupId === 20);
  setActiveInstitution(rabbit.id);
  expect(getActiveInstitution().serverGroupId).toBe(20);

  syncServerGroups([{ id: 10, name: "גן א", role: "manager" }]);
  expect(getActiveInstitution().serverGroupId).toBe(10);
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
