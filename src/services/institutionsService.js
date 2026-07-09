/*
  institutionsService — ריבוי מוסדות תחת משתמש אחד (UI_SPEC ס' 3.5).
  משתמשת אחת יכולה לנהל כמה ועדים/מוסדות. הרכישה מכסה את המוסד הראשון;
  מוסד נוסף דורש "רכישה" (מסך זמני) והרשמה משלו.

  Stage 1 (נוכחי — צד לקוח בלבד): הרשימה והמוסד הפעיל נשמרים ב-localStorage.
  כל מוסד שומר את נתוני ההרשמה שלו; החלפת מוסד טוענת את נתוני ההרשמה שלו
  למפתח ה-onboarding המשותף, כך שהכותרת, הגבייה והקטגוריות מתחלפים.
  ⏳ Stage 2 (שרת): הפרדת התלמידים/התשלומים בפועל לפי מוסד.

  מבנה מוסד: { id, name, type, activated, onboarding }
*/
const LIST_KEY = "vaadygo.institutions";
const ACTIVE_KEY = "vaadygo.activeInstitution";
const ONBOARDING_KEY = "vaadygo.onboarding"; // משותף עם onboardingService

function readList() {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY)) || [];
  } catch {
    return [];
  }
}

function writeList(list) {
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

export function getInstitutions() {
  return readList();
}

export function getActiveInstitution() {
  const list = readList();
  if (list.length === 0) {
    return null;
  }
  const activeId = localStorage.getItem(ACTIVE_KEY);
  return list.find((i) => i.id === activeId) || list[0];
}

/*
  מעבר למוסד אחר. מותר רק למוסד מופעל. טוען את נתוני ההרשמה שלו למפתח
  המשותף כדי שכל האפליקציה תשקף אותו. מחזיר true בהצלחה.
*/
export function setActiveInstitution(id) {
  const institution = readList().find((i) => i.id === id);
  if (!institution || !institution.activated) {
    return false;
  }
  localStorage.setItem(ACTIVE_KEY, id);
  if (institution.onboarding) {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(institution.onboarding));
  }
  return true;
}

/* מסמן מוסד לא-מופעל כ"פעיל" לצורך ההרשמה שלו (אחרי הרכישה הזמנית). */
export function beginActivation(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

/*
  נקרא בסיום אשף ההרשמה. בפעם הראשונה — יוצר את המוסד הראשי (מופעל) ואת
  המוסדות הנוספים ששמותיהם הוזנו (לא-מופעלים). אחרת — מפעיל את המוסד הפעיל
  הנוכחי עם נתוני ההרשמה שלו (הפעלת מוסד נוסף אחרי רכישה).
*/
export function saveActiveOnboarding(data) {
  let list = readList();
  const stamp = Date.now();

  if (list.length === 0) {
    const mainId = `inst-main-${stamp}`;
    const main = {
      id: mainId,
      name: (data.ganName || "המוסד שלי").trim(),
      type: data.institutionType || "gan",
      activated: true,
      onboarding: data,
    };
    const extras = (data.extraCommitteeNames || [])
      .filter((n) => n && n.trim())
      .map((name, i) => ({
        id: `inst-extra-${stamp}-${i}`,
        name: name.trim(),
        type: "gan",
        activated: false,
        onboarding: null,
      }));
    list = [main, ...extras];
    localStorage.setItem(ACTIVE_KEY, mainId);
  } else {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    list = list.map((i) =>
      i.id === activeId
        ? { ...i, name: (data.ganName || i.name).trim(), activated: true, onboarding: data }
        : i
    );
  }

  writeList(list);
}
