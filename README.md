# VaadyGo 💜

מערכת לניהול ועד הורים בגנים ובבתי ספר — תלמידים, גבייה, תקציב, אירועים, מתנות, ספקים, קבצים ועוזרת AI. הכל במקום אחד, בעברית, מותאם לנייד.

**המשתמשות:** חברות ועד בלבד (2-3 לגן), לא כל ההורים.

## מבנה המערכת

| רכיב | טכנולוגיה | מיקום |
|------|-----------|-------|
| צד לקוח (הריפו הזה) | React | `Desktop\parentcommitteefrontend`, רץ על http://localhost:3000 |
| צד שרת | ASP.NET Core Web API | `C:\Vaddygo\ParentCommitteeAPI`, רץ על https://localhost:7017 |
| מסד נתונים | SQLite (בעתיד SQL Server) | קובץ `vaadygo.db` בצד השרת |
| אחסון בענן | Railway | פריסה אוטומטית מ-main אחרי CI |

## איך מריצים מקומית

1. מפעילים את השרת (ParentCommitteeAPI) מ-Visual Studio.
2. בתיקייה הזאת: `npm install` (פעם ראשונה בלבד) ואז `npm start`.
3. נפתח דפדפן על http://localhost:3000.

## מסמכי הפרויקט — סדר קריאה לכל סוכן AI ומפתח

1. [README.md](README.md) — המסמך הזה
2. [ARCHITECTURE.md](ARCHITECTURE.md) — כללי הארכיטקטורה המחייבים
3. [AI_RULES.md](AI_RULES.md) — כללי עבודה לסוכני AI והרשאות
4. [ROADMAP.md](ROADMAP.md) — מסמך המשימות של החזון: איפה אנחנו ומה הלאה
5. [PROJECT_LOG.md](PROJECT_LOG.md) — יומן הפרויקט: מה נעשה עד עכשיו
6. [DEPLOYMENT.md](DEPLOYMENT.md) — איך המערכת עולה לאוויר (CI/CD + Railway)

**מתחילים לעבוד עם סוכן חדש? מדביקים לו את [AGENT_PROMPT.md](AGENT_PROMPT.md).**

## עקרונות על

- עברית מלאה, RTL, Mobile-First, צבע ראשי סגול `#7C3AED`
- קוד גנרי לשימוש חוזר — אף פעם לא משכפלים לוגיקה
- כל מסך עם מצבי טעינה / שגיאה / ריק
- אין secrets בקוד. אף פעם.
- כל משימה מסתיימת בעדכון PROJECT_LOG.md
