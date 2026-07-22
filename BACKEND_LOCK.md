# 🔒 נעילת שרת — BACKEND LOCK

**חוק ברזל: רק סוכן אחד עובד על ה-backend בכל רגע נתון.**
עבודה מקבילה על השרת כבר גרמה נזק חוזר — מיגרציות מסובכות זו בזו, טסטים שבורים, ו-CI אדום שחסם פריסה לכולם. לכן חובה להשתמש בנעילה הזאת.

---

## מצב הנעילה (השורה הבאה היא האמת היחידה):

STATUS: LOCKED by [Claude Fable 5, 2026-07-22 - team roles: membership + invite + AccessScope enforcement (stage 1)]

<!-- כשנעול, השורה למעלה תיראה כך: STATUS: LOCKED by [שם הסוכן, YYYY-MM-DD HH:MM] -->

---

## מה נחשב "עבודת backend" (דורש נעילה)

כל שינוי בתיקיית **`backend/`**: מודלים (`Models/`), מיגרציות (`Migrations/`), ‏`AppDbContext.cs`, ‏`Program.cs`, ‏DTOs, ‏Services, ‏Controllers, ‏`appsettings.json`, ‏`.csproj`.

**עבודת frontend (`src/`) לא דורשת נעילה** — רק הקפד לא לערוך קבצים שסוכן אחר נוגע בהם.

## הפרוטוקול (חובה)

1. **לפני כל עבודת backend:** ‏`git pull`. קרא את שורת ה-STATUS למעלה.
2. אם `STATUS: FREE` → שנה אותה ל-`STATUS: LOCKED by [שמך, תאריך ושעה]`, עשה commit (`"Lock backend: <שמך>"`) ו-**push מיד**.
   - אם ה-push **נדחה** → מישהו תפס לפניך. ‏`git pull` וקרא שוב.
3. אם `STATUS: LOCKED by <מישהו אחר>` → **אסור בהחלט לגעת ב-backend.** אתה חייב **לעצור** את חלק ה-backend שלך: עבוד רק על frontend, או המתן, או דווח לבעלת המוצר. אל תדרוס, אל "תשלים על הדרך".
4. **בסיום** עבודת ה-backend (הכל committed + pushed ו-CI ירוק): החזר `STATUS: FREE`, commit (`"Unlock backend"`) ו-push.
5. **נעילה ישנה מ-45 דקות** = הסוכן שתפס כנראה כבר לא רץ. מותר לקחת אותה (ציין בהודעת ה-commit "taking stale lock").

## למה זה קריטי

בסיס הנתונים משתמש בקובץ snapshot יחיד ומשותף (EF Core). כששני סוכנים מוסיפים מיגרציה במקביל, ה-snapshot של שני מכיל את השינוי של הראשון — ואי אפשר לדחוף אף אחד מהם בלי לשבור את השני או להרוס עבודה. הנעילה מונעת בדיוק את זה.
