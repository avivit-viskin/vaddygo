import {
  saveActiveOnboarding,
  getInstitutions,
  getActiveInstitution,
  setActiveInstitution,
  beginActivation,
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
