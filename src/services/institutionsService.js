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
  שינוי שם מוסד (למשל תיקון טעות הקלדה). מעדכן את השם ברשימת המוסדות וגם
  בנתוני ההרשמה (ganName) — שהם מקור הכותרת בכל האפליקציה. אם זה המוסד הפעיל,
  מעדכן גם את מפתח ה-onboarding המשותף כדי שהשינוי ייראה מיד לאחר רענון.
  סנכרון השם לשרת נעשה בנפרד (groupsService.renameGroup) כדי שיישמר גם אחרי
  ניקוי דפדפן או כניסה ממכשיר אחר. מחזיר true בהצלחה.
*/
export function renameInstitution(id, rawName) {
  const name = (rawName || "").trim();
  if (!name) {
    return false;
  }
  const list = readList();
  if (!list.some((i) => i.id === id)) {
    return false;
  }
  const updated = list.map((i) =>
    i.id === id
      ? {
          ...i,
          name,
          onboarding: i.onboarding
            ? { ...i.onboarding, ganName: name }
            : i.onboarding,
        }
      : i
  );
  writeList(updated);

  // אם זה המוסד הפעיל — לעדכן גם את ההרשמה המשותפת (מקור הכותרת בכל המסכים)
  if (localStorage.getItem(ACTIVE_KEY) === id) {
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        localStorage.setItem(
          ONBOARDING_KEY,
          JSON.stringify({ ...data, ganName: name })
        );
      }
    } catch {
      /* אם ההרשמה המשותפת לא קריאה — מדלגים; השם ברשימה כבר עודכן */
    }
  }
  return true;
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
/*
  syncServerGroups — מסנכרן את רשימת המוסדות המקומית עם הגנים מהשרת
  (GET /api/groups). כל גן מהשרת — בבעלות המשתמש או כזה שהוזמן אליו כחבר —
  מתווסף/מתעדכן ברשימה לפי serverGroupId, יחד עם ההרשאה שלו (role). כך גן
  שהוזמנת אליו מופיע ב-InstitutionSwitcher וניתן לפתוח אותו, ולפי ה-role
  יודעים אם הוא לקריאה-בלבד. מוסדות מקומיים בלבד (שטרם נוצרו בשרת) נשמרים כמו
  שהם. מחזיר את הרשימה המעודכנת.
*/
export function syncServerGroups(groups) {
  if (!Array.isArray(groups)) {
    return readList();
  }
  const list = readList();
  const byServerId = new Map(
    list
      .filter((i) => i.serverGroupId != null)
      .map((i) => [i.serverGroupId, i])
  );
  groups.forEach((g) => {
    if (g == null || g.id == null) {
      return;
    }
    // הרשאה מהשרת: manager|editor|viewer. ברירת מחדל manager (תאימות לאחור:
    // גנים קיימים שהשרת עדיין לא מחזיר להם role — הבעלים).
    const role = g.role || "manager";
    const existing = byServerId.get(g.id);
    if (existing) {
      // מוסד קיים: מעדכנים שם/הרשאה בלבד — לא דורסים את ה-onboarding המקומי
      // (עשוי להכיל שדות מקומיים שאינם בשרת).
      existing.name = g.name || existing.name;
      existing.role = role;
      existing.activated = true;
    } else {
      // מוסד חדש (בדרך כלל גן שהוזמנת אליו): שומרים גם את נתוני ההרשמה מהשרת
      // (g.onboarding, אם צורף) כדי שהמעבר אליו יציג את הגן הנכון ויעבור את
      // שער ההרשמה של האפליקציה.
      list.push({
        id: `inst-server-${g.id}`,
        name: g.name || "מוסד",
        type: "gan",
        activated: true,
        onboarding: g.onboarding || null,
        serverGroupId: g.id,
        role,
      });
    }
  });
  writeList(list);
  return list;
}

/*
  ההרשאה של המשתמש במוסד הפעיל: "manager" | "editor" | "viewer".
  ברירת מחדל "manager" — מוסדות ישנים ללא שדה role נחשבים בבעלות (תאימות לאחור).
*/
export function getActiveRole() {
  return getActiveInstitution()?.role || "manager";
}

/* האם המוסד הפעיל הוא לצפייה בלבד (המשתמש "צופה") — משמש להסתרת כפתורי עריכה. */
export function isActiveReadOnly() {
  return getActiveRole() === "viewer";
}

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
