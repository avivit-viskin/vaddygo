# ARCHITECTURE.md — כללי הארכיטקטורה המחייבים

אם מסמך זה מתנגש עם קוד קיים — המסמך מנצח, אלא אם בעלת המוצר אישרה אחרת.

## עקרונות יסוד

DRY (אין קוד כפול) · SOLID (אחריות אחת לכל מחלקה/רכיב) · KISS · YAGNI · בונים פעם אחת, משתמשים לנצח · מרחיבים במקום לשכתב.

**הפרדה מלאה בין צד השרת לצד הלקוח:** כל צד מפותח בנפרד, בתיקייה/ריפו משלו, והתקשורת ביניהם היא אך ורק דרך ה-API (JSON). אסור ללקוח לדעת שום דבר על מבנה המסד, ואסור לשרת להכיל לוגיקת תצוגה.

**שכבות ביצוע (בשני הצדדים):** Presentation ← Business Layer (BL) ← Data Access Layer (DAL). בשרת: Controllers ← Services (BL) ← Repositories (DAL). בלקוח: Pages/Components ← Hooks ← Services (api). לעולם לא מדלגים על שכבה ולא הופכים את כיוון התלות.

**מודולריות:** כל רכיב, Service ו-Hook עומדים בפני עצמם, גנריים וניתנים להרחבה — המערכת תגדל עם הזמן, והקוד נכתב מראש כך שהרחבה לא תדרוש שכתוב.

## צד לקוח — React (הריפו הזה)

### מבנה תיקיות מחייב

```
src/
├── components/   רכיבים גנריים לשימוש חוזר (Button, Input, Card, Table, Modal...)
├── pages/        מסכים (HomePage, StudentsPage...)
├── services/     כל קריאות ה-API — קובץ api.js יחיד עם כתובת בסיס אחת
├── hooks/        לוגיקה משותפת (useApi, useForm...)
└── styles/       עיצוב משותף (צבעים, טיפוגרפיה)
```

### כללים

- **כל קומפוננטה בקובץ נפרד משלה** (לפי חוקי React): קובץ אחד = קומפוננטה אחת = אחריות אחת. אין קבצים עם כמה קומפוננטות.
- **אסור `fetch` בתוך קומפוננטות** — הכל דרך שכבת `services`.
- כתובת ה-API מגיעה ממשתנה סביבה `REACT_APP_API_URL` (בפיתוח: `https://localhost:7017`). לא כותבים כתובות קשיחות בקוד.
- רכיבי UI נבנים פעם אחת ב-`components` ומשמשים בכל המסכים. אין עיצוב מקומי חד-פעמי.
- כל מסך חייב: מצב טעינה (spinner/skeleton), מצב שגיאה ידידותי בעברית, מצב ריק ("עדיין אין תלמידים — הוסיפי את הראשונה!").
- טפסים: ולידציה בצד לקוח **וגם** בצד שרת, הודעת שגיאה ליד השדה, כפתור נעול בזמן שליחה.

### UI/UX

- עברית מלאה, `dir="rtl"` בכל מסך, Mobile-First.
- צבע ראשי סגול `#7C3AED` (הלב הסגול 💜 של VaadyGo), רקעים בהירים, פינות מעוגלות.
- נגישות: ניגודיות מספקת, אזורי מגע 44px לפחות, תווית לכל שדה.

## צד שרת — ASP.NET Core (בתיקייה `C:\Vaddygo\ParentCommitteeAPI`)

- **Controllers** — דקים בלבד: מקבלים בקשה, מעבירים ל-Service, מחזירים תשובה.
- **Services** — כל הלוגיקה העסקית. לכל Service יש Interface (`IStudentService`) ורישום ב-Dependency Injection.
- **Repositories** — גישה לנתונים בלבד, דרך Generic Repository‏ (`IRepository<T>` עם GetAll/GetById/Add/Update/Delete).
- **DTOs** — לעולם לא מחזירים מודל מסד ללקוח. לכל ישות: CreateDto, UpdateDto, ResponseDto.
- async/await בכל גישה למסד. טיפול שגיאות מרכזי ב-Middleware אחד (לא try/catch בכל קונטרולר).
- ILogger בכל Service/Controller. בלי מידע רגיש (טלפונים, שמות מלאים) בלוגים.

## מסד נתונים

- כל שינוי מבנה — רק דרך Migration עם שם תיאורי (`AddPaymentFields`, לא `Update1`).
- Foreign Keys ו-Navigation Properties תמיד. required/nullable מוגדרים במודל — לא מנחשים.
- SQLite בפיתוח; הקוד נכתב כך שמעבר ל-SQL Server = החלפת connection string בלבד.

## אבטחה

- אין secrets בקוד — רק appsettings.json / User Secrets / משתני סביבה / GitHub Secrets / Railway Variables.
- ולידציה בצד השרת על כל קלט. אין אמון בקלט מהלקוח.
- CORS: בפיתוח localhost:3000 בלבד; בייצור — הדומיין הספציפי בלבד.
- הודעות שגיאה ללקוח לא חושפות פרטים טכניים; הפירוט המלא הולך ללוג.
- פרטי ילדים והורים = מידע רגיש.
- נקודות קצה בנויות כך שהוספת JWT בעתיד תהיה שכבה נוספת, לא שכתוב.

## שמות

Classes/Methods: PascalCase · משתנים: camelCase · קבועים: UPPER_CASE · רכיבי React: PascalCase (`StudentCard.js`) · hooks: `useCamelCase`.
