# DEPLOYMENT.md — איך VaadyGo עולה לאוויר

## התמונה הגדולה

```
את דוחפת קוד ל-main  →  GitHub Actions בודק (טסטים + build)  →  Railway פורס אוטומטית  →  האתר מתעדכן
```

אם הבדיקות נכשלות — Railway לא פורס, והגרסה הקודמת ממשיכה לרוץ. ככה אי אפשר "לשבור" את האתר בטעות.

## CI — GitHub Actions

הקובץ [.github/workflows/ci.yml](.github/workflows/ci.yml) רץ אוטומטית על כל push ל-main. הוא: מתקין תלויות → מריץ טסטים → בונה את האפליקציה. רואים את התוצאה בטאב **Actions** בעמוד הריפו ב-GitHub (✅ ירוק = עבר, ❌ אדום = נכשל).

## Railway — הקמה ראשונית (עושים פעם אחת)

1. נכנסים ל-https://railway.app ולוחצים **Login** → **Login with GitHub** (מתחברים עם אותו חשבון GitHub).
2. לוחצים **New Project** → **Deploy from GitHub repo**.
3. בפעם הראשונה Railway יבקש הרשאה לגשת ל-GitHub — לוחצים **Configure GitHub App**, בוחרים את הריפו `avivit-viskin/vaddygo` ומאשרים.
4. בוחרים את `vaddygo` מהרשימה. Railway יתחיל Build אוטומטית.
5. **Start Command:** נכנסים לשירות שנוצר → **Settings** → **Deploy** → בשדה **Custom Start Command** כותבים:
   ```
   npx serve -s build -l 3000
   ```
   (זה אומר ל-Railway: אחרי הבנייה, הגש את התיקייה `build` כאתר סטטי על פורט 3000.)
6. **Wait for CI:** באותו עמוד Settings, מחפשים את המתג **Wait for CI** ומדליקים אותו. זה מה שגורם ל-Railway לחכות שהבדיקות ב-GitHub יעברו לפני פריסה.

## איך מקבלים דומיין (כתובת לאתר)

בהתחלה לשירות ב-Railway **אין כתובת ציבורית** — צריך לבקש אחת (זה חינם):

1. בעמוד הפרויקט ב-Railway לוחצים על השירות (הקופסה עם שם הריפו).
2. עוברים לטאב **Settings**.
3. גוללים לחלק **Networking** (או **Public Networking**).
4. לוחצים על **Generate Domain**. אם נשאלת על פורט — מזינים **3000** (חייב להתאים לפורט שב-Start Command).
5. Railway ייצור כתובת בסגנון `vaddygo-production.up.railway.app` — זו הכתובת של האתר! לוחצים עליה כדי לפתוח.

בהמשך, אם תרצי דומיין משלך (למשל `vaadygo.co.il`), קונים דומיין ובאותו מקום לוחצים **Custom Domain** — אבל בשלב הזה הדומיין החינמי מספיק לגמרי.

## פריסת הבקאנד (השרת) ל-Railway — עושים פעם אחת

הקוד כבר מוכן לזה (Dockerfile + האזנה לפורט של Railway). מה שנשאר הוא בלחיצות בדשבורד:

1. באותו פרויקט ב-Railway לוחצים **+ New** (או New Service) → **GitHub Repo** → בוחרים שוב את `avivit-viskin/vaddygo`. נוצר שירות שני — זה יהיה השרת.
2. נכנסים לשירות החדש → **Settings**:
   - בשדה **Root Directory** כותבים: `backend` — ככה Railway בונה רק את תיקיית השרת (הוא ימצא לבד את ה-Dockerfile).
   - מדליקים **Wait for CI** (כמו בפרונט).
3. **דיסק קבוע למסד הנתונים** (חשוב! בלעדיו הנתונים נמחקים בכל עדכון): לוחצים קליק ימני על השירות (או ⋮) → **Attach Volume** → ב-**Mount Path** כותבים: `/data`.
4. טאב **Variables** של שירות השרת — מוסיפים:
   ```
   ConnectionStrings__Default = Data Source=/data/vaadygo.db
   Cors__AllowedOrigins__0    = https://<הדומיין-של-הפרונט>.up.railway.app
   ```
   (מחליפים בכתובת האמיתית של האתר שלך, בלי / בסוף.)
5. **דומיין לשרת:** Settings → Networking → **Generate Domain**. אם נשאלת על פורט — **8080**.
6. **מחברים את הפרונט לשרת:** עוברים לשירות של הפרונט → **Variables** → מוסיפים:
   ```
   REACT_APP_API_URL = https://<הדומיין-של-השרת>.up.railway.app
   ```
   (בלי / בסוף ובלי ‎/api — הנתיבים בקוד כבר כוללים אותו.) Railway יבנה מחדש את הפרונט אוטומטית.
7. **בדיקה:** פותחים בדפדפן `https://<הדומיין-של-השרת>.up.railway.app/api/students` — אמור לחזור `[]` (רשימה ריקה). ואז באתר עצמו: מסך התלמידים אמור להיטען בלי הודעת שגיאה.

## דברים חשובים לדעת
- **משתני סביבה:** בטאב **Variables** של השירות ב-Railway מגדירים משתנים כמו `REACT_APP_API_URL` (יוגדר בשלב 1). לעולם לא שומרים סודות בקוד.
- **לוגים:** טאב **Deployments** → לוחצים על הפריסה → **View Logs**. שם רואים למה build נכשל אם נכשל.
- **Rollback (חזרה אחורה):** בטאב **Deployments** רואים את כל הפריסות הקודמות. ליד פריסה ישנה שעבדה לוחצים על ⋮ → **Redeploy** — והאתר חוזר לגרסה ההיא תוך דקות.

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| Build נכשל ב-Railway | לבדוק ב-View Logs; לרוב חסר Start Command או שה-build נכשל גם מקומית (`npm run build`) |
| האתר מציג דף ריק | לוודא שה-Start Command הוא בדיוק `npx serve -s build -l 3000` ושפורט הדומיין הוא 3000 |
| הפריסה לא קורית אחרי push | לבדוק שה-CI ירוק בטאב Actions ב-GitHub; אם אדום — Railway מחכה בכוונה |
