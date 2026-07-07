# PROJECT_LOG.md — יומן הפרויקט

זהו הזיכרון של הפרויקט. כל סוכן חדש מתחיל מקריאתו, וכל משימה שהושלמה מוסיפה רשומה בפורמט:
`## [תאריך] — [שם המשימה]` עם: מה נעשה / למה / קבצים / החלטות / הצעד הבא.
רשומות חדשות נוספות **למעלה**.

---

## 08.07.2026 — אפיון מסכים מלא מהפנקס + פונט מותג Rubik

- **מה נעשה:** בעלת המוצר שלחה 11 צילומי פנקס עם אפיון כל המסכים. נוצר UI_SPEC.md — תרגום מלא ומחייב של האפיון (פתיחה, כניסה, אשף הרשמה, הגדרת גבייה, מסך בית, צוות, התראות, תלמידים, מתנות, קבצים, עוזרת AI). הוחל פונט מותג Rubik בכל המערכת (index.html + theme.css). ROADMAP עודכן (שלב 3 הורחב למסכי פתיחה/הרשמה/גבייה; שלבים 4, 7 פורטו). נוצר קובץ שאלות לבעלת המוצר: שולחן העבודה → "VaadyGo - שאלות אפיון.doc".
- **למה:** האפיון בכתב יד הוא מקור האמת למוצר; בעלת המוצר ביקשה שינוי פונט מיידי בגרסה המפורסמת ושהאפיון ייכנס למשימות הסוכנים.
- **קבצים:** UI_SPEC.md (חדש), public/index.html, src/styles/theme.css, ROADMAP.md, AGENT_PROMPT.md, PROJECT_LOG.md
- **החלטות ארכיטקטוניות:** Rubik נבחר כפונט מותג (ממתין לאישור סופי — שאלה 1 בקובץ השאלות); כל משימת UI מחויבת לקרוא את UI_SPEC.md; פריטי ❓ ב-UI_SPEC לא מממשים לפני תשובת בעלת המוצר.
- **הצעד המומלץ הבא:** כשבעלת המוצר עונה על קובץ השאלות — לעדכן את UI_SPEC.md ולהסיר ❓. משימת הפיתוח הבאה: שלב 2 (מסך תלמידים מלא) לפי UI_SPEC ס' 11.

## 08.07.2026 — שלב 0: הכנת הבקאנד להעלאה לריפו נפרד (בדיקת secrets + git מקומי)

- **מה נעשה:** הוכנה תיקיית הבקאנד `C:\Vaddygo\ParentCommitteeAPI` להעלאה לריפו GitHub נפרד. (1) אומת ידנית שאין secrets: `appsettings.json` ו-`appsettings.Development.json` מכילים רק הגדרות Logging + AllowedHosts; `launchSettings.json` רק פורטים; ה-connection string ב-`Program.cs` הוא SQLite מקומי בלי סיסמה. (2) נוצר `.gitignore` תקני ל-.NET שמחריג `bin/`, `obj/`, `*.user`, קבצי SQLite (`*.db`, `-shm`, `-wal`) וכל `.env`/secrets. (3) בוצע `git init` + קומיט ראשון מקומי (ענף `main`, 18 קבצי מקור בלבד — קבצי ה-DB והבנייה לא נכנסו, אומת).
- **למה:** משימת שלב 0 ב-ROADMAP. הכנה מקומית מלאה מקטינה את הצעד החיצוני (יצירת ריפו + דחיפה) לפעולה קטנה ומלווה לבעלת המוצר, ומבטיחה שסודות לא יעלו לענן.
- **קבצים:** `C:\Vaddygo\ParentCommitteeAPI\.gitignore` (חדש) + git מקומי חדש שם; בריפו הפרונט: `ROADMAP.md`, `PROJECT_LOG.md`.
- **החלטות:** לא בוצעה יצירת ריפו GitHub / דחיפה / פריסת Railway — אלה פעולות חיצוניות שדורשות אישור בעלת המוצר. `WeatherForecast.cs`/הבקר שלו (שאריות תבנית) הושארו כפי שהם — הסרתם היא שינוי קוד שיטופל ביישור הבקאנד בשלב 2.
- **הצעד המומלץ הבא:** בעלת המוצר: ליצור ריפו GitHub פרטי לבקאנד ולדחוף (`git remote add origin <URL>` → `git push -u origin main`). לאחר מכן — שלב 2: יישור `StudentsController` לארכיטקטורה (Controller דק → `IStudentService` → `IRepository<Student>` + DTOs + ולידציה + Middleware שגיאות).

## 07.07.2026 — שלב 1 הושלם: תשתית פרונטאנד מלאה

- **מה נעשה:** נבנתה כל תשתית הפרונטאנד לפי ARCHITECTURE.md: מבנה תיקיות מלא (`components/ pages/ services/ hooks/ styles/`), שכבת API יחידה (`services/api.js` — כתובת מ-`REACT_APP_API_URL`, שגיאות אחידות בעברית), hook גנרי `useApi` (טעינה/שגיאה/נתונים), ערכת עיצוב `styles/theme.css` (סגול `#7C3AED`, RTL גלובלי, פינות מעוגלות, אזורי מגע 44px), 9 רכיבי בסיס (Button, Input, Card, Modal, Table, Spinner, EmptyState, ErrorMessage, BrandName), ניווט תחתון `BottomNav` עם React Router v6 וחמישה עמודים (בית, תלמידים, לוח שנה, מתנות, קבצים). מסך התלמידים הקיים הועבר ל-`StudentsPage` עם שלושת המצבים המחייבים. נוספו 6 טסטים. `index.html` עודכן ל-`lang="he" dir="rtl"` וכותרת VaadyGo.
- **למה:** זהו הבסיס שכל המסכים הבאים ייבנו עליו — בלי לשכפל עיצוב או לוגיקת רשת.
- **קבצים:** `src/components/` (10 קבצים), `src/pages/` (5), `src/services/` (2), `src/hooks/useApi.js`, `src/styles/theme.css`, `src/App.js`, `src/index.js`, `src/App.test.js`, `public/index.html`, `.env.development`, `.env.test`, `package.json`. נמחקו קבצי CRA מתים: `App.css`, `index.css`, `logo.svg`.
- **החלטות:** React Router **v6** (ולא v7) — יציב עם Create React App, עם דגלי future של v7 כדי שלא יהיו אזהרות והמעבר העתידי יהיה קל. כתובת השרת בפיתוח יושבת ב-`.env.development` (לא סוד); בייצור תוגדר ב-Railway Variables כשהבקאנד יעלה (שלב 0). פקודת ההגשה `npx serve -s build` כבר תומכת בניתוב צד-לקוח.
- **הצעד המומלץ הבא:** שלב 2 — מסך תלמידים מלא (טופס הוספה/עריכה, מחיקה, חיפוש) + יישור הבקאנד לארכיטקטורה. במקביל, בעלת המוצר יכולה להשלים את חיבור Railway לפי DEPLOYMENT.md כדי שהאתר יהיה באוויר.

## 07.07.2026 — כלל עיצוב חדש: השם VaadyGo תמיד מודגש ב-UI

- **מה נעשה:** נוסף כלל UI/UX ל-ARCHITECTURE.md: השם **VaadyGo** מוצג תמיד מודגש (bold) בכל מקום שהוא מופיע ב-UI.
- **למה:** הנחיה של בעלת המוצר (אביבית) — חיזוק המותג בכל המסכים.
- **קבצים:** ARCHITECTURE.md, PROJECT_LOG.md
- **החלטות:** לא נדרש שינוי קוד כרגע — המופע היחיד היום הוא ב-`<h1>` ב-App.js, שכבר מודגש כברירת מחדל. הכלל מחייב מכאן והלאה כל מסך חדש.
- **הצעד המומלץ הבא:** בשלב 1 של ה-ROADMAP (ערכת עיצוב), לעגן את הכלל ברכיב גנרי (למשל `<BrandName />`) כדי שלא יישכח.

## 07.07.2026 — תשתית: GitHub, תיעוד מלא, CI

- **מה נעשה:** הפרויקט נדחף לראשונה ל-GitHub‏ (https://github.com/avivit-viskin/vaddygo). נוצר מערך תיעוד מלא (README, ARCHITECTURE, AI_RULES, ROADMAP, PROJECT_LOG, DEPLOYMENT, AGENT_PROMPT). הוקם CI ב-GitHub Actions שמריץ בדיקות ו-build על כל push. תוקן הטסט הדיפולטי של CRA שנכשל. נוספה חבילת `serve` להגשת ה-build ב-Railway.
- **למה:** לפי האפיון, PROJECT_LOG הוא הזיכרון של הפרויקט וכל סוכן מתחיל ממנו; CI מבטיח שכל דחיפה ל-main נבדקת לפני פריסה אוטומטית ל-Railway.
- **קבצים:** README.md, AGENT_PROMPT.md, ARCHITECTURE.md, AI_RULES.md, ROADMAP.md, PROJECT_LOG.md, DEPLOYMENT.md, ‎.github/workflows/ci.yml, src/App.test.js, package.json, ‎.gitignore
- **החלטות ארכיטקטוניות:** עבודה ישירה על main (אישור קבוע מבעלת המוצר) עם CI כשער איכות; Railway ב-Wait for CI כך שפריסה קורית רק אחרי בדיקות ירוקות; כתובת ה-API תעבור ל-`REACT_APP_API_URL` בשלב 1.
- **הצעד המומלץ הבא:** בעלת המוצר מחברת את הריפו ל-Railway ומפיקה דומיין לפי DEPLOYMENT.md. אחר כך: שלב 1 ב-ROADMAP — מבנה תיקיות + api.js + רכיבי בסיס.

## 07.07.2026 — קומיט ראשון ודחיפה ל-GitHub

- **מה נעשה:** קומיט ראשון של שלד CRA עם מסך רשימת תלמידים (App.js קורא ל-GET /api/students). תוקן remote שגוי, הוצא settings.local.json מהריפו.
- **למה:** נקודת פתיחה מגובה לפרויקט.
- **קבצים:** כל קבצי הפרויקט הראשוניים.
- **הצעד המומלץ הבא:** בוצע — ראו הרשומה שמעל.
