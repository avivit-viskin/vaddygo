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

/* מזהה ה-Group בשרת של המוסד הפעיל — נשלח ב-X-Institution לסינון הנתונים. */
export function getActiveServerGroupId() {
  return getActiveInstitution()?.serverGroupId ?? null;
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
  הוספת מוסד חדש (ועד נוסף) — נוצר במצב לא-מופעל ("🔒 להפעלה"), ומופיע ברשימת
  המוסדות. ההפעלה בפועל (רכישה + הרשמה) נעשית בלחיצה עליו. מחזיר את המזהה.
*/
export function addInstitution(name) {
  const list = readList();
  const id = `inst-extra-${Date.now()}`;
  list.push({
    id,
    name: name.trim(),
    type: "gan",
    activated: false,
    onboarding: null,
    serverGroupId: null,
  });
  writeList(list);
  return id;
}

/*
  מחיקת מוסד בודד מהרשימה המקומית (נתוני השרת נמחקים בנפרד דרך deleteGroup).
  אם המוסד שנמחק היה הפעיל — עוברים למוסד מופעל אחר וטוענים את נתוניו, או
  מנקים אם לא נשאר אף מוסד. מחזיר את הרשימה המעודכנת.
*/
export function removeInstitution(id) {
  const list = readList().filter((i) => i.id !== id);
  writeList(list);
  const activeId = localStorage.getItem(ACTIVE_KEY);
  if (activeId === id) {
    const nextActive = list.find((i) => i.activated);
    if (nextActive) {
      localStorage.setItem(ACTIVE_KEY, nextActive.id);
      if (nextActive.onboarding) {
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify(nextActive.onboarding));
      } else {
        localStorage.removeItem(ONBOARDING_KEY);
      }
    } else {
      localStorage.removeItem(ACTIVE_KEY);
      localStorage.removeItem(ONBOARDING_KEY);
    }
  }
  return list;
}

/*
  נקרא בסיום אשף ההרשמה. בפעם הראשונה — יוצר את המוסד הראשי (מופעל) ואת
  המוסדות הנוספים ששמותיהם הוזנו (לא-מופעלים). אחרת — מפעיל את המוסד הפעיל
  הנוכחי עם נתוני ההרשמה שלו (הפעלת מוסד נוסף אחרי רכישה).
*/
export function saveActiveOnboarding(data, serverGroupId = null) {
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
      serverGroupId, // מזהה ה-Group בשרת, לסינון הנתונים
    };
    const extras = (data.extraCommitteeNames || [])
      .filter((n) => n && n.trim())
      .map((name, i) => ({
        id: `inst-extra-${stamp}-${i}`,
        name: name.trim(),
        type: "gan",
        activated: false,
        onboarding: null,
        serverGroupId: null,
      }));
    list = [main, ...extras];
    localStorage.setItem(ACTIVE_KEY, mainId);
  } else {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    list = list.map((i) =>
      i.id === activeId
        ? {
            ...i,
            name: (data.ganName || i.name).trim(),
            activated: true,
            onboarding: data,
            serverGroupId: serverGroupId ?? i.serverGroupId ?? null,
          }
        : i
    );
  }

  writeList(list);
}
