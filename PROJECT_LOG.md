# PROJECT_LOG.md — יומן הפרויקט

זהו הזיכרון של הפרויקט. כל סוכן חדש מתחיל מקריאתו, וכל משימה שהושלמה מוסיפה רשומה בפורמט:
`## [תאריך] — [שם המשימה]` עם: מה נעשה / למה / קבצים / החלטות / הצעד הבא.
רשומות חדשות נוספות **למעלה**.

---

## 09.07.2026 — שלב 9 הושלם: עוזרת AI (Claude) — שרת + לקוח

- **מה נעשה:** נבנתה עוזרת ה-AI. **שרת:** `AiController` (`POST /api/ai/ask`) דק → `IAiService`/`AiService` הקורא ל-Claude (Anthropic Messages API, דגם `claude-opus-4-8`) דרך HttpClient מוקצה (typed). מפתח ה-API נקרא מ-`Anthropic:ApiKey` (משתני סביבה בלבד); כשחסר — 503 עם הודעה ידידותית במקום שגיאה. persona בעברית, `max_tokens` מוגבל, טיפול בסירוב בטיחותי (`stop_reason=refusal`), וחילוץ טקסט בטוח מהתשובה. **לקוח:** `AiAssistantPage` (UI_SPEC ס' 14) — פתיח "במה ברצונך לעזור?", צ'יפים לשאלות מהירות (ניסוח תזכורת/הזמנה, רעיונות מתנה, טיפים לתקציב), שדה שאלה חופשית, ותשובה עם מצבי טעינה/שגיאה; `AiFab` — כפתור AI צף (UI_SPEC ס' 10) בנתיב `/assistant`; `aiService` עובר דרך שכבת ה-API. 3 טסטי לקוח + build ירוק; ה-endpoint אומת מקצה-לקצה מול שרת רץ (503 ללא מפתח, 400 על שאלה ריקה).
- **למה:** בעלת המוצר בחרה את שלב 9 כהמשך. העוזרת עוזרת לחברות הוועד לנסח הודעות ולקבל רעיונות — עומס שיורד מהכתפיים, לפי חזון VaadyGo.
- **קבצים:** שרת: `backend/Controllers/AiController.cs`, `backend/DTOs/AiDtos.cs`, `backend/Services/{IAiService,AiService}.cs`, `backend/Program.cs` (רישום HttpClient), `backend/appsettings.json` (סקשן `Anthropic` עם מפתח ריק — בלי סוד). לקוח: `src/pages/AiAssistantPage.js` + טסט, `src/components/AiFab.js`, `src/services/aiService.js`, `src/styles/ai.css`, `src/App.js` (נתיב + כפתור צף).
- **החלטות:** (1) **קריאה גולמית ב-HttpClient ולא NuGet SDK** — .NET 10 חדש מאוד, והוספת תלות ל-Anthropic SDK עלולה לסכן את בניית ה-CI/Railway; קריאת Messages בודדת ב-HttpClient+System.Text.Json יציבה ב-100% וללא תלות חדשה. (2) **פרטיות:** לא נשלחים לבינה שמות/טלפונים — רק טקסט השאלה; רקע כללי לא-מזהה אפשרי בעתיד (יעד/נגבה/תקציבי חגים) בלי שמות. (3) הדגם `claude-opus-4-8` כברירת מחדל (ניתן לשינוי דרך `Anthropic:Model`). (4) המפתח נשאר ריק ב-appsettings — הערך האמיתי במשתני סביבה בלבד.
- **⚠️ הערה לתיאום (סוכנים מקבילים):** במקביל נחת שלב 10 (אבטחה/JWT) שהוסיף `FallbackPolicy` הדורש משתמש מזוהה בכל endpoint. משמעות: `/api/ai/ask` יידרש token ברגע שהאבטחה תיכנס לתוקף — וזה **תקין ורצוי** (חברת ועד מזוהה). לא הוספתי `[AllowAnonymous]`. חיבור הפרונט לשליחת token הוא באחריות שלב 10.
- **הצעד המומלץ הבא:** בעלת המוצר מוסיפה מפתח Anthropic (User Secrets בפיתוח, Railway Variables בייצור) ובודקת את העוזרת. בעתיד: לצרף לעוזרת רקע כספי כללי (מ-Dashboard) לשאלות "מצב כספי".

## 09.07.2026 — שלב 7 שדרוג: מודל עסקי לספקים (תמונות, וואטסאפ, רשתות חברתיות)

- **מה נעשה:** מימשתי את החלטת בעלת המוצר (09.07.2026) על מודל הספקים — ספקים בתשלום שהמנהלת מוסיפה ידנית (ערוץ הכנסה). זו התשובה לשאלה הפתוחה על "ספקים מומלצים". **שרת:** ל-`VendorProduct` נוסף `ImageUrl`, ל-`Vendor` נוסף `WhatsApp`, ונוספה ישות Owned חדשה `VendorSocialLink` (label + url) + Migration‏ `AddVendorContactAndImages`. `VendorService` מחליף גם את רשימת הרשתות החברתיות בעדכון (כמו המוצרים). **לקוח:** `VendorForm` הורחב (וואטסאפ, קישור תמונה לכל מוצר, ורשימת רשתות חברתיות דינמית), `VendorPanel` מציג תמונות מוצרים, כפתור וואטסאפ ירוק וצ'יפים לרשתות. נוצר עוזר `whatsapp.js` שבונה קישור wa.me ממספר טלפון (0 מוביל→972) או מקישור מלא. טסט חדש (5 במסך המתנות, 43 בסך הכל) + build ירוק. אומת מקצה-לקצה מול שרת רץ: POST עם וואטסאפ+תמונה+רשת חזר 201 ונשמר נכון, וספק ישן קיבל שדות ריקים (המיגרציה additive, לא שברה נתונים).
- **למה:** זו מטרת ההכנסה המרכזית של בעלת המוצר — ספקים משלמים כדי להיות מוצגים במערכת עם המוצרים, הוואטסאפ והרשתות שלהם.
- **קבצים:** שרת: `backend/Models/{Vendor,VendorProduct,VendorSocialLink}.cs`, `backend/DTOs/VendorDtos.cs`, `backend/Services/VendorService.cs`, `backend/AppDbContext.cs`, Migration `AddVendorContactAndImages`. לקוח: `src/pages/gifts/{VendorForm,VendorPanel}.js`, `src/services/whatsapp.js`, `src/pages/gifts/GiftsPage.test.js`, `src/styles/gifts.css`.
- **החלטות:** (1) וואטסאפ נשמר כקלט חופשי (טלפון או קישור); העוזר `whatsapp.js` מזהה ובונה wa.me — לא שוכפל מ-`paymentsService` כדי לא לגעת בקובץ של סוכן אחר, ניקוי-DRY עתידי אפשרי. (2) תמונות כ-URL בשלב זה (העלאת קובץ אמיתית תבוא עם תשתית ה-Drive, שלב 8) — מתועד ב-UI_SPEC ס' 12. (3) `VendorSocialLink` הוא Owned עם label חופשי (אינסטגרם/פייסבוק/אתר) — גמיש בלי לקבע רשתות בקוד.
- **הצעד הבא:** שלב 10 (אבטחה/כניסה) אופיין (UI_SPEC ס' 2: שם משתמש/סיסמה + Google, תוקף מנוי עד 30.8) — פתוח לביצוע ויפתח את הגבלת ניהול הספקים ל"מנהל-על"; שלב 8 (Drive) אופיין אך תלוי בשלב 10.

## 09.07.2026 — שלב 7 הושלם: מתנות וספקים (שרת + לקוח)

- **מה נעשה:** נבנה מסך המתנות והספקים לפי UI_SPEC ס' 12, שרת ולקוח. **שרת:** מודלים `Vendor` (עם `VendorProduct` כישות Owned) ו-`Gift` (שם, מזהה חג, תקציב, סטטוס planned/buying/done, קישור לספק) + Migration‏ `AddGiftsAndVendors`; שכבות מלאות — `GiftsController`/`VendorsController` דקים → `IGiftService`/`IVendorService`. Gift עובד דרך ה-Repository הגנרי (אין לו Owned); Vendor עובד דרך DbContext עם Include למוצרים (כמו GroupService). ולידציה בעברית, כולל הגבלת הסטטוס ל-3 הערכים בלבד. **לקוח:** `GiftsPage` — ספירה לאחור לחג הקרוב (מחושבת מלוח השנה העברי דרך `upcomingHoliday.js`, שנשען על `holidays.js` הקיים), רשימת מתנות עם סטטוס צבעוני ותקציב, טופס הוספה/עריכה, עוזרת תקציבית שמחשבת "נוצל X מתוך Y" מול תקציב החג, ודף ספק (מודאל) עם מוצרים וקטלוג. 4 טסטים חדשים (סה"כ 41 עוברים) + build ירוק.
- **למה:** מסך המתנות סוגר את הלולאה עם תקציבי החגים שהוגדרו בלוח השנה (שלב 6) — מה שתוקצב לחג מתחבר עכשיו למתנות בפועל דרך העוזרת התקציבית.
- **קבצים:** שרת: `backend/Models/{Vendor,VendorProduct,Gift}.cs`, `backend/DTOs/{GiftDtos,VendorDtos}.cs`, `backend/Services/{IGiftService,GiftService,IVendorService,VendorService}.cs`, `backend/Controllers/{GiftsController,VendorsController}.cs`, `backend/AppDbContext.cs`, `backend/Program.cs` (DI), Migration `AddGiftsAndVendors`. לקוח: `src/pages/GiftsPage.js`, `src/pages/gifts/` (CountdownBanner, GiftCard, GiftForm, BudgetAssistant, VendorPanel, VendorForm + טסטים), `src/services/{giftsService,vendorsService,upcomingHoliday,giftStatus}.js`, `src/styles/gifts.css`.
- **החלטות:** (1) **DRY:** מזהה החג ("שם|שנה עברית") זהה למזהה תקציב החג (`holidayBudgetKey`) ולחישוב החגים ב-`holidays.js` — שלושתם מדברים באותה שפה, בלי לשכפל לוגיקת תאריכים. (2) הספירה לאחור לא ממציאה תאריכים — נשענת על לוח השנה העברי המובנה בדפדפן. (3) המתנות והספקים עובדים גם בלי שרת (fallback ל-localStorage, כמו שאר המסכים) — רשומות מקומיות מסומנות `isLocal`. (4) `VendorProduct` הוא Owned — עריכת ספק מחליפה את כל רשימת המוצרים (RemoveRange + הוספה), פשוט ותואם לטופס.
- **⛔ שאלה לבעלת המוצר:** באפיון (UI_SPEC ס' 12) יש "ספקים מומלצים" עם דוגמה "מתנות בלב❓" — לא ברור אם זו רשימת המלצות קבועה של VaddyGo או סתם דוגמה. כרגע מימשתי שהספקים הם אלה שהמשתמשת מוסיפה בעצמה. אם רוצים רשימת המלצות מובנית — צריך להגדיר מאיפה היא מגיעה.
- **הצעד הבא:** שלב 8 (קבצים/Google Drive) ושלב 9 (עוזרת AI) פתוחים אך דורשים אפיון מדויק עם בעלת המוצר לפני ביצוע; שלב 10 (אבטחה/כניסה) פתוח לביצוע.

## 09.07.2026 — שלב 6 הושלם: צד-שרת ללוח השנה (EventsController) + חיבור הלקוח

- **מה נעשה:** נבנה צד-השרת של לוח השנה לפי הארכיטקטורה: מודל `Event` הורחב בשדה `Reminder` (bool) עם Migration‏ `AddEventReminder` (עמודה additive, ברירת מחדל false); `EventsController` דק → `IEventService`/`EventService` (BL) → `IRepository<Event>` גנרי (DAL), עם DTOs (`EventCreateDto`/`EventUpdateDto`/`EventResponseDto` על בסיס `EventWriteDto` משותף — DRY), ולידציה ב-DataAnnotations בעברית (שם חובה עד 100, תיאור עד 500, מיקום עד 100), ולוגים במזהים בלבד. נרשם ב-DI ב-Program.cs. בצד הלקוח `eventsService` חובר ל-`/api/events` עם נפילה חיננית ל-localStorage כשהשרת לא זמין. אומת מקצה-לקצה מול שרת רץ (POST עם reminder=true, GET, ולידציה 400 על שם חסר, DELETE). 10 טסטי לקוח + build עוברים.
- **למה:** משלים את שלב 6 — האירועים ייכתבו למסד האמיתי כשהבקאנד יפרס, בלי לשנות אף מסך. עד אז הלוח עובד מקומית בדפדפן.
- **קבצים:** backend: `Models/Event.cs`, `DTOs/EventDtos.cs`, `Services/IEventService.cs`, `Services/EventService.cs`, `Controllers/EventsController.cs`, `Program.cs`, `Migrations/*AddEventReminder*` + `AppDbContextModelSnapshot.cs`. frontend: `src/services/eventsService.js`.
- **החלטות:** (1) הפעלת השירות עקבית ל-StaffService/StudentService (אותה תבנית בדיוק — Repository גנרי, מיפוי DTO↔מודל, ApplyWrite משותף). (2) התאריך נשמר כתאריך בלבד (Date, בלי שעה) כמו ב-StaffMember. (3) נמצא שרת backend זומבי שרץ 9.3 שעות ונעל את ה-bin — נעצר (שרת פיתוח מקומי, SQLite נשמר לדיסק) כדי לאפשר build/migration. (4) תקציבי החגים (מהמשימה הקודמת) עדיין ב-localStorage — יחוברו ל-API כשייבנה endpoint לתקציבים.
- **הצעד המומלץ הבא:** פריסת הבקאנד ל-Railway (שלב 0, אצל בעלת המוצר) כדי שהאירועים והתשלומים יעבדו באתר החי; אחריו אפשר לחבר גם את תקציבי החגים ל-API.

## 09.07.2026 — שלב 5 הושלם: תשלומים (שרת + לקוח) + חיבור הדשבורד לנתונים אמיתיים

- **מה נעשה:** **בשרת** — מודל `Payment` (תלמיד, קטגוריה, סכום, אמצעי, שולם/לא, תאריך תשלום) המקושר ל-`CollectionCategory` הקיים; ‏Migration‏ `AddPayments` (FK ל-Students ול-CollectionCategories, מחיקה מדורגת); שכבות מלאות — `PaymentsController` דק מקונן תחת תלמיד (`GET/PUT api/students/{id}/payments[/{categoryId}]`) ← `IPaymentService`/`PaymentService`. ה-GET מסנתז שורה לכל קטגוריית גבייה של הגן (רשומה קיימת או ברירת-מחדל "טרם שולם"); ה-PUT הוא upsert. ולידציה (`IValidatableObject`): אמצעי בתוך bit/paybox/cash, אמצעי חובה כשמסמנים ששולם, סכום לא שלילי — הודעות בעברית. **בנוסף:** `DashboardService` חובר לתשלומים האמיתיים — הנגבה בפועל, הפירוק לפי אמצעי תשלום והפירוק לפי קטגוריה מחושבים כעת מהתשלומים ששולמו (השלמת ה-handoff שהושאר בשלב 4). **בלקוח** — `StudentPaymentsPage` בנתיב `/students/:id/payments` (נגיש מכפתור "תשלומים 💰" בכרטיס תלמיד): שורה לכל קטגוריה עם `PaymentRow` — בחירת אמצעי, סימון "שולם" ידני, סטטוס צבעוני ירוק, וביטול סימון; כפתור "שלחי תזכורת בוואטסאפ" שפותח `wa.me/<טלפון בפורמט בינלאומי>` עם הודעה מוכנה המפרטת את הקטגוריות שטרם שולמו והסכום הכולל. נוצר רכיב `paymentMethods` משותף (תוויות + אפשרויות בחירה) ו-`CollectionCard` עודכן להשתמש בו במקום מפה מקומית (DRY). 8 טסטים חדשים.
- **למה:** התשלומים הם ליבת המערכת — מכאן הוועד יודע מי שילם ומי לא, והדשבורד (שלב 4) סוף-סוף מציג נתונים אמיתיים במקום אפסים.
- **קבצים:** שרת: `backend/Models/Payment.cs`, `backend/DTOs/PaymentResponseDto.cs` + `PaymentUpsertDto.cs`, `backend/Services/IPaymentService.cs` + `PaymentService.cs`, `backend/Controllers/PaymentsController.cs`, `backend/Migrations/*AddPayments*`, `backend/AppDbContext.cs`, `backend/Program.cs`, `backend/Services/DashboardService.cs`. לקוח: `src/pages/StudentPaymentsPage.js` + טסט, `src/pages/payments/PaymentRow.js`, `src/services/paymentsService.js` + טסט, `src/services/paymentMethods.js`, `src/services/studentsService.js` (getStudent), `src/pages/StudentsPage.js` + טסט, `src/components/StudentCard.js`, `src/pages/home/CollectionCard.js`, `src/App.js`, `src/styles/payments.css`.
- **החלטות:** ‏(1) **`CollectionCategory` במקום `PaymentCategory` נפרד** (ה-ROADMAP הזכיר `PaymentCategory`, אך קטגוריות הגבייה כבר קיימות משלב 3 — שכפול היה מפר DRY). (2) הגן היחיד: הקטגוריות נלקחות מהגן הראשון, כמו ב-Dashboard. (3) MVP — רשומת תשלום אחת לכל (תלמיד, קטגוריה) עם שולם/לא; מעקב פר-תשלום (1/2/3) הוא הרחבה עתידית (מספר התשלומים כבר שמור בקטגוריה). (4) הבנייה, המיגרציה וה-smoke-test רצו בעותק מבודד ב-scratchpad כי שרת אחר (פורט 7017, VS/סוכן) נעל את ה-bin — נמנעה הפרעה; אומת מקצה לקצה (יצירה, סימון, ולידציה 400, דשבורד מציג נגבה=1200/24%, ביטול, 404).
- **הצעד המומלץ הבא:** צד השרת של שלב 6 (`EventsController` בשכבות + חיבור `eventsService` ל-API), שלב 7 (מתנות וספקים), או פריסת Railway (שלב 0) אצל בעלת המוצר כדי שהאתר החי יעבוד מול נתונים אמיתיים.

## 09.07.2026 — שלב 4 הושלם: מסך הבית — דשבורד מלא (שרת + לקוח)

- **מה נעשה:** נבנה מסך הבית לפי UI_SPEC ס' 8, שרת ולקוח. **שרת:** endpoint חדש `GET /api/dashboard` — כל החישובים ב-`DashboardService` (יעד גבייה, נגבה, יתרת קופה, חוב פתוח, פירוק לפי אמצעי תשלום ולפי קטגוריה, התראות, ימי הולדת קרובים); מודל `StaffMember` חדש עם CRUD מלא ב-`/api/staff` (שם, תפקיד, תאריך לידה — UI_SPEC ס' 8); נוסף שדה `Year` ל-`Group` עם כלל שנת-לימודים משותף (`SchoolYear.cs`) ו-Migration‏ `AddYearAndStaffMembers`. **לקוח:** `HomePage` חדש — כותרת "שם הגן + שנה עברית" (המרה אוטומטית: 2026→תשפ"ז), פעמון עם מונה התראות, כרטיס גבייה עם החלפה בין יעד ליתרה/חוב, בר התקדמות, פירוק ביט/פייבוקס/מזומן, תשלומים לפי קטגוריות, וימי הולדת של הצוות עם הוספה ועריכה במודאל. נוספו 4 טסטים (סה"כ 27 עוברים) + build ירוק.
- **למה:** זה המסך הראשון שבעלת המוצר רואה בכל כניסה — תמונת מצב של הוועד במבט אחד, לפי האפיון מהפנקס.
- **קבצים:** שרת: `backend/Models/StaffMember.cs`, `backend/Models/Group.cs` (Year), `backend/DTOs/DashboardResponseDto.cs`, `backend/DTOs/StaffMemberDtos.cs`, `backend/DTOs/GroupCreateDto.cs`+`GroupResponseDto.cs` (Year), `backend/Services/{IDashboardService,DashboardService,IStaffService,StaffService,SchoolYear}.cs`, `backend/Services/GroupService.cs`, `backend/Controllers/{DashboardController,StaffController}.cs`, `backend/AppDbContext.cs`, `backend/Program.cs` (DI), Migration חדשה. לקוח: `src/pages/HomePage.js`, `src/pages/home/` (CollectionCard, AlertsList, CategoryList, StaffBirthdays, StaffForm + טסטים), `src/services/{dashboardService,staffService,schoolYear,format}.js`, `src/styles/home.css`.
- **החלטות:** (1) הנגבה-בפועל ופירוק אמצעי התשלום מוחזרים כ-0 עד שמודל Payment ייבנה בשלב 5 — מבנה התשובה כבר סופי כדי ששלב 5 לא ישבור את הלקוח. (2) מסך הבית עובד גם בלי שרת: fallback מקומי שבונה את אותו מבנה מנתוני האשף (חשוב כל עוד הבקאנד לא פרוס). (3) אנשי צוות שנוצרו בלי שרת נשמרים ב-localStorage ויסונכרנו בעתיד; רשומות מקומיות מסומנות `isLocal`. (4) גנים שנוצרו לפני עמודת Year מקבלים את השנה הנוכחית (fallback בשרת). (5) תוקן באג מנוסחת הקריאה של האשף: `/groups` → `/api/groups` (הוסכם עם ממצא הסשן המקביל).
- **הצעד הבא:** שלב 5 (תשלומים) כבר נתפס — כשיושלם, לחבר את הנגבה-בפועל בדשבורד לנתוני אמת (ה-TODO מסומן ב-`DashboardService`). לבעלת המוצר: פריסת הבקאנד לפי DEPLOYMENT.md תדליק את הסנכרון המלא.

## 09.07.2026 — שלב 0: הבקאנד מוכן לפריסה ב-Railway (הצד הטכני)

- **מה נעשה:** הבקאנד הוכן לענן: `backend/Dockerfile` (בנייה דו-שלבית, ‎.NET 10) + `.dockerignore`; ‏`Program.cs` מאזין למשתנה `PORT` שמזריק Railway ומדלג על הפניית https בענן (Railway מסיים TLS); ל-CI נוסף job שבונה את הבקאנד על כל push — שרת שבור חוסם פריסה. ‏DEPLOYMENT.md הורחב במדריך צעד-אחר-צעד: שירות שני מהריפו (Root Directory=`backend`), ‏Volume קבוע ב-`/data` למסד ה-SQLite, משתני סביבה (`ConnectionStrings__Default`, ‏`Cors__AllowedOrigins__0`), דומיין על פורט 8080, וחיבור הפרונט עם `REACT_APP_API_URL`. אומת ש-dotnet build עובר אחרי השינויים.
- **למה:** בלי בקאנד באוויר האתר החי מציג רק את הודעת השגיאה; אחרי הפריסה כל המסכים יעבדו מול נתונים אמיתיים.
- **קבצים:** backend/Dockerfile (חדש), backend/.dockerignore (חדש), backend/Program.cs, ‏.github/workflows/ci.yml, DEPLOYMENT.md.
- **החלטות:** (1) Dockerfile ולא זיהוי אוטומטי — דטרמיניסטי ושקוף. (2) SQLite על Volume ב-`/data` — בלי Volume הנתונים נמחקים בכל פריסה; המעבר ל-SQL Server נשאר החלפת connection string (שלב 11). (3) `PORT=8080` כברירת מחדל בקונטיינר, תואם להוראת הדומיין במדריך.
- **הצעד המומלץ הבא:** בעלת המוצר מבצעת את פעולות הדשבורד לפי DEPLOYMENT.md (סעיף "פריסת הבקאנד"). אחר כך: שלב 4 (מסך הבית) או צד השרת של שלב 6 (EventsController).

## 09.07.2026 — לוח השנה: מבנה חדש + תקציב לכל חג (בקשת בעלת המוצר)

- **מה נעשה:** מסך לוח השנה אורגן מחדש לשלושה מדורים לפי הנחיית אביבית: (1) הלוח עם פאנל "הוספת אירוע" בצד (במסך רחב; בנייד — מתחת), (2) מדור **חגים** — שם ותאריך של כל חג בחודש, וליד כל חג כפתור תקציב שפותח חלון עם הנוסח המדויק: "שלום לך, לפני שנמשיך לנהל נכון בעזרת **VaddyGo** נא לציין את התקציב שייצא בחג זה" + שדה סכום בש"ח; הסכום מוצג ליד החג וניתן לעריכה, (3) מדור **האירועים שלי** עם מחיקה באישור. נוספו 3 טסטים (סה"כ 10 בלוח).
- **למה:** הנחיה ישירה מבעלת המוצר (09.07.2026), כולל תשובותיה לשאלות: כפתור ליד כל חג (לא חלון אוטומטי), סכום מוצג + ניתן לעריכה, רשימת האירועים נשארת.
- **קבצים:** `src/pages/CalendarPage.js`, `src/pages/calendar/{HolidaysSection,HolidayBudgetDialog}.js` (חדשים), `src/services/holidayBudgetsService.js` (חדש), `src/data/holidays.js` (מופעי חגים עם שנה עברית), `src/styles/calendar.css`, טסטים.
- **החלטות:** מזהה תקציב = שם החג + השנה העברית — כך חנוכה תשפ"ז הוא מופע אחד גם בדצמבר וגם בינואר. התקציבים נשמרים זמנית ב-localStorage (כמו האירועים) עם service אסינכרוני מוכן להחלפה ל-API; בשרת קיים מודל `Budget` שיוכל לשמש לזה. הסכומים ייצרכו את "העוזרת התקציבית" של מסך המתנות (שלב 7).
- **הצעד המומלץ הבא:** צד-שרת של שלב 6 (EventsController + API לתקציבי חגים) כשקבצי ה-backend יתפנו; מסך המתנות (שלב 7) יקרא את תקציבי החגים.

## 09.07.2026 — שלב 2 הושלם: מסך תלמידים מלא (לקוח + שרת)

- **מה נעשה:** **בשרת** — ‏`StudentsController` יושר לארכיטקטורה המחייבת: Controller דק ← `IStudentService` (BL) ← `IRepository<Student>` גנרי (DAL), עם שלושה DTOs (בסיס ולידציה משותף `StudentWriteDto`), ולידציה ב-DataAnnotations (חובה/אורך/פורמט טלפון 05X-XXXXXXX), ‏Middleware שגיאות מרכזי (לוג מלא, הודעה ידידותית בעברית ללקוח), ‏ILogger במזהים בלבד (בלי שמות/טלפונים), ומעבר מרשימה זמנית בזיכרון ל-SQLite האמיתי — מיגרציות רצות אוטומטית בעלייה, ו-connection string + CORS עברו ל-appsettings (פיתוח: localhost:3000 בלבד). **בלקוח** — ‏`StudentsPage` מלא: כרטיסים עם מונה "X תלמידים", חיפוש חופשי, סינון לפי כיתה, הוספה ועריכה באותו `StudentForm` במודאל (ולידציה זהה לשרת, כפתור נעול בשליחה), מחיקה עם `ConfirmDialog`. נוספו רכיבים גנריים: `Select`, ‏`ConfirmDialog`, ‏hook ‏`useForm`; ‏`api.js` מציג כעת את הודעת השגיאה שהשרת שלח. 7 טסטים חדשים + build ירוק. אומת מקצה לקצה מול שרת רץ (יצירה, ולידציה 400, עדכון, מחיקה 204).
- **למה:** מסך התלמידים הוא הבסיס לגבייה (שלב 5) — כל תלמיד עם טלפון הורה לתזכורות; והשכבות בשרת הן התבנית לכל ה-API-ים הבאים (שלב 3 שרת כבר נבנה עליהן).
- **קבצים:** שרת: `backend/DTOs/` (4), `backend/Repositories/` (2), `backend/Services/` (2), `backend/Middleware/ErrorHandlingMiddleware.cs`, `backend/Controllers/StudentsController.cs`, `backend/Program.cs`, `backend/appsettings.json`, `backend/Models/` (תיקוני nullable). לקוח: `src/pages/StudentsPage.js` + `StudentsPage.test.js`, `src/components/{StudentForm,StudentCard,ConfirmDialog,Select}.js`, `src/hooks/useForm.js`, `src/services/{studentsService,api}.js`, `src/styles/theme.css`.
- **החלטות:** ‏(1) טלפון נשמר מנורמל בלי מקף; הוולידציה מקבלת את שני הפורמטים — זהה בלקוח ובשרת. (2) ‏DELETE מחזיר 204; ‏NotFound מחזיר `{ message }` בעברית ש-api.js יודע להציג. (3) שדה `Grade` נשאר במודל אך לא נחשף ב-DTOs — החלוקה לקבוצות מוסדרת בקשר Student→Group (שלב 3 שרת). (4) תאריך לידה ואופן תשלום מ-UI_SPEC ס' 11 יתווספו בשלבים 3/5 (תלויים בקטגוריות גבייה) — לא הומצאו שדות. (5) הלוגים באנגלית ובמזהים בלבד — פרטי ילדים והורים לא נכתבים ללוג.
- **הצעד המומלץ הבא:** שלב 4 (מסך הבית) או שלב 5 (תשלומים) — שניהם פתוחים; וחיבור Railway (שלב 0) אצל בעלת המוצר.

## 09.07.2026 — שלב 3 הושלם: Group API בשרת + חיבור אשף ההרשמה

- **מה נעשה:** נבנה צד השרת של שלב 3 לפי הארכיטקטורה: מודלים `Group` ו-`CollectionCategory` (+ קשר אופציונלי Student→Group), Migration‏ `AddGroupAndCollectionCategories`, שכבות מלאות (`GroupsController` דק → `IGroupService`/`GroupService`) עם DTOs וולידציה בעברית. יעד הגבייה מחושב בשרת. `onboardingService` בפרונט חובר ל-`POST /api/groups` עם נפילה חיננית לשמירה מקומית כשהשרת לא זמין (כפתור "כניסה לאפליקציה" ננעל בזמן השמירה). אומת מקצה לקצה מול שרת רץ: יצירה, שליפה, ושגיאות ולידציה. 23 טסטים עוברים, build ירוק.
- **למה:** משלים את אשף ההרשמה — הנתונים שהמשתמשת מזינה נשמרים עכשיו במסד האמיתי.
- **קבצים:** backend: Models/Group.cs, Models/CollectionCategory.cs, Models/Student.cs, AppDbContext.cs, Program.cs, DTOs/GroupCreateDto.cs, DTOs/GroupResponseDto.cs, Services/IGroupService.cs, Services/GroupService.cs, Controllers/GroupsController.cs, Migrations/*AddGroupAndCollectionCategories*; frontend: src/services/onboardingService.js, src/pages/onboarding/OnboardingWizard.js + טסט.
- **החלטות:** (1) `GroupService` ניגש ל-DbContext ישירות (לא דרך ה-Repository הגנרי) כי גן נטען תמיד עם הקטגוריות שלו (Include) — חריגה מתועדת. (2) קבוצות הגן נשמרות כמחרוזת מופרדת בפסיקים (KISS) — ינורמלו לטבלה אם יקבלו התנהגות. (3) ועדים נוספים (ריבוי ועדים) נשארו מקומיים בלבד — ממתין לתשובת בעלת המוצר (שאלה 3) לפני עיצוב רב-ועדים. (4) שם קטגוריה נשלח לשרת בלי הסיומת "(אופציונלי)".
- **הצעד המומלץ הבא:** שלב 0 — פריסת הבקאנד ל-Railway (+ `REACT_APP_API_URL` ו-CORS לדומיין הייצור), כדי שהאתר החי יעבוד מול נתונים אמיתיים. לחלופין: צד שרת של שלב 6 (EventsController) שהתפנה, או שלב 4 (מסך הבית).

## 08.07.2026 — שלב 6 (צד לקוח): לוח שנה עברי עם חגים ואירועים

- **מה נעשה:** נבנה `CalendarPage` מלא — תצוגת חודש בעברית (רשת ראשון-שבת, ניווט בין חודשים, כותרת לועזית + טווח חודשים עבריים), חגי ישראל מסומנים בלוח וברשימה חודשית, הוספת אירוע במודאל (שם, תאריך, מיקום, תיאור, תזכורת 🔔) עם ולידציה וכפתור נעול, ומחיקת אירוע עם מודאל אישור. נוספו 7 טסטים (כולל אימות שחנוכה 2026 וראש השנה 2026 מחושבים נכון).
- **למה:** משימת צד-הלקוח של שלב 6. שלבים 2-3 היו תפוסים על ידי סוכנים מקבילים, ושלב 6 הוא הבלתי-תלוי הראשון שהיה פנוי.
- **קבצים:** `src/pages/CalendarPage.js` (הוחלף מ-placeholder), `src/pages/calendar/` (MonthGrid, EventForm, טסטים), `src/data/holidays.js`, `src/services/eventsService.js`, `src/styles/calendar.css`, `src/components/Checkbox.js` (גנרי חדש).
- **החלטות:** (1) **חגים בלי להמציא תאריכים:** כל חג מוגדר לפי התאריך העברי הקבוע שלו (עובדה), וההמרה ללועזי נעשית במנוע התאריכים המובנה בדפדפן (Intl בלוח עברי) — מדויק לכל שנה, כולל כללי ההזזה החוקיים של יום העצמאות/הזיכרון. עדיף על רשימה מוקלדת ידנית שעלולה לטעות. (2) **אין עדיין `/api/events` בשרת** — האירועים נשמרים זמנית ב-localStorage דרך `eventsService` עם אותם שדות כמו מודל `Event` בשרת; כשצד-השרת ייבנה מחליפים רק את גוף הפונקציות ב-service, בלי לגעת במסכים. (3) צד-השרת של שלב 6 ממתין בכוונה — הסוכן של שלב 2 עורך כרגע את קבצי ה-backend, ועבודה מקבילה שם תיצור התנגשויות.
- **הצעד המומלץ הבא:** כשקבצי ה-backend יתפנו — משימת צד-השרת של שלב 6 (EventsController בשכבות + שדה Reminder + Migration) וחיבור `eventsService` ל-API האמיתי.

## 08.07.2026 — שלב 3 (צד לקוח): מסכי פתיחה, כניסה ואשף הרשמה

- **מה נעשה:** נבנו כל מסכי הכניסה לפי UI_SPEC ס' 1-6: `WelcomePage` (נוסח הפתיחה המדויק מהפנקס + שני כפתורים), `LoginPage` (מייל, סיסמה עם עין — UI בלבד), ואשף `OnboardingWizard` ב-5 צעדים (פרטי גן → קבוצות גן/בי"ס → ועדים נוספים 1-4 → הגדרת גבייה ב-4 קטגוריות עם 1/2/3 תשלומים וחישוב יעד אוטומטי → סיכום "הכל מוכן!"). כניסה ראשונה ל-`/` מפנה ל-`/welcome`; אחרי סיום האשף נכנסים לאפליקציה. נוספו 3 טסטים (סה"כ 9 עוברים) + build ירוק.
- **למה:** אלה המסכים הראשונים שכל משתמשת חדשה פוגשת, לפי האפיון מהפנקס.
- **קבצים:** src/pages/WelcomePage.js, src/pages/LoginPage.js, src/pages/onboarding/ (OnboardingWizard, GanDetailsStep, GroupsStep, CommitteesStep, CollectionStep, SummaryStep + טסט), src/services/onboardingService.js, src/styles/onboarding.css, src/App.js (נתיבים + הסתרת ניווט במסכי פתיחה), src/App.test.js (סימון onboarding בטסטים).
- **החלטות:** נתוני האשף נשמרים ב-localStorage דרך onboardingService עד שיהיה Group API — ההחלפה תהיה בשירות בלבד, בלי לגעת במסכים. סכומי הפנקס (1,200/500/400/125) הם placeholders, לא ערכי ברירת מחדל. לא מוצגת הודעת "נשלחה הזמנה ל-X משתמשים" כי הזמנות עוד לא באמת נשלחות. עיר בהקלדה חופשית עד שבעלת המוצר תאשר מקור לרשימת יישובים. פריטי ❓ נשארו בקובץ השאלות.
- **הצעד המומלץ הבא:** צד השרת של שלב 3 (מודל Group + CollectionCategory + חיבור onboardingService ל-API) — כדאי על בסיס הארכיטקטורה החדשה שיושרה בבקאנד. במקביל: פריסת הבקאנד ל-Railway (שלב 0).

## 08.07.2026 — הבקאנד הוכנס לריפו (mono-repo, תיקיית `backend/`)

- **מה נעשה:** לפי החלטת בעלת המוצר לעבוד ב-**mono-repo** (הכל בריפו אחד), קוד השרת `ParentCommitteeAPI` הוכנס לתיקיית `backend/` בתוך ריפו `vaddygo`, נדחף ל-main. הועברו **רק קבצי המקור שגיט עוקב אחריהם** (18 קבצים) באמצעות `git archive HEAD` → חילוץ ל-`backend/` — כך שקבצי `bin/`, `obj/`, ו-SQLite (`*.db`) לא נכנסו. `backend/.gitignore` נשמר (מחריג build/db/secrets גם בתת-התיקייה).
- **למה:** בעלת המוצר בחרה mono-repo כשהתבקשה להכריע (הכתובת שנתנה הייתה הריפו הקיים של הפרונט; הובהר שדחיפת הבקאנד לשם הייתה דורסת את הפרונט, ולכן במקום זה — תיקיית משנה). זה מבטל את הצורך בריפו GitHub שני ובאישור ליצירתו.
- **קבצים:** `backend/` (18 קבצי מקור: Program.cs, AppDbContext.cs, Controllers, Models, Migrations, appsettings*, launchSettings, csproj, slnx, .gitignore), `ARCHITECTURE.md`, `ROADMAP.md`, `PROJECT_LOG.md`.
- **החלטות:** מקור האמת לקוד השרת הוא מעתה `backend/` בריפו. העותק ב-`C:\Vaddygo\ParentCommitteeAPI` הוא עותק פיתוח מקומי ישן — כדי למנוע שני עותקים שמתפצלים, יש לפתוח/לערוך את השרת מ-`backend/`. ה-`git init` המקומי שנוצר קודם ב-`C:\Vaddygo` הוסר (מיותר ב-mono-repo). לא נגעתי בקוד השרת עצמו — יישורו לארכיטקטורה (Service/Repository/DTOs) הוא שלב 2.
- **הצעד המומלץ הבא:** שלב 2 — מסך תלמידים מלא (לקוח, לפי UI_SPEC ס' 11) + יישור `StudentsController` בבקאנד לארכיטקטורה (Controller דק → `IStudentService` → `IRepository<Student>` + DTOs + ולידציה + Middleware). בנוסף: פריסת הבקאנד ל-Railway מתיקיית `backend/` + עדכון `REACT_APP_API_URL`.

## 08.07.2026 — אפיון מסכים מלא מהפנקס + פונט מותג Rubik

- **מה נעשה:** בעלת המוצר שלחה 11 צילומי פנקס עם אפיון כל המסכים. נוצר UI_SPEC.md — תרגום מלא ומחייב של האפיון (פתיחה, כניסה, אשף הרשמה, הגדרת גבייה, מסך בית, צוות, התראות, תלמידים, מתנות, קבצים, עוזרת AI). הוחל פונט מותג Rubik בכל המערכת (index.html + theme.css). ROADMAP עודכן (שלב 3 הורחב למסכי פתיחה/הרשמה/גבייה; שלבים 4, 7 פורטו). נוצר קובץ שאלות לבעלת המוצר: שולחן העבודה → "VaddyGo - שאלות אפיון.doc".
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

- **מה נעשה:** נבנתה כל תשתית הפרונטאנד לפי ARCHITECTURE.md: מבנה תיקיות מלא (`components/ pages/ services/ hooks/ styles/`), שכבת API יחידה (`services/api.js` — כתובת מ-`REACT_APP_API_URL`, שגיאות אחידות בעברית), hook גנרי `useApi` (טעינה/שגיאה/נתונים), ערכת עיצוב `styles/theme.css` (סגול `#7C3AED`, RTL גלובלי, פינות מעוגלות, אזורי מגע 44px), 9 רכיבי בסיס (Button, Input, Card, Modal, Table, Spinner, EmptyState, ErrorMessage, BrandName), ניווט תחתון `BottomNav` עם React Router v6 וחמישה עמודים (בית, תלמידים, לוח שנה, מתנות, קבצים). מסך התלמידים הקיים הועבר ל-`StudentsPage` עם שלושת המצבים המחייבים. נוספו 6 טסטים. `index.html` עודכן ל-`lang="he" dir="rtl"` וכותרת VaddyGo.
- **למה:** זהו הבסיס שכל המסכים הבאים ייבנו עליו — בלי לשכפל עיצוב או לוגיקת רשת.
- **קבצים:** `src/components/` (10 קבצים), `src/pages/` (5), `src/services/` (2), `src/hooks/useApi.js`, `src/styles/theme.css`, `src/App.js`, `src/index.js`, `src/App.test.js`, `public/index.html`, `.env.development`, `.env.test`, `package.json`. נמחקו קבצי CRA מתים: `App.css`, `index.css`, `logo.svg`.
- **החלטות:** React Router **v6** (ולא v7) — יציב עם Create React App, עם דגלי future של v7 כדי שלא יהיו אזהרות והמעבר העתידי יהיה קל. כתובת השרת בפיתוח יושבת ב-`.env.development` (לא סוד); בייצור תוגדר ב-Railway Variables כשהבקאנד יעלה (שלב 0). פקודת ההגשה `npx serve -s build` כבר תומכת בניתוב צד-לקוח.
- **הצעד המומלץ הבא:** שלב 2 — מסך תלמידים מלא (טופס הוספה/עריכה, מחיקה, חיפוש) + יישור הבקאנד לארכיטקטורה. במקביל, בעלת המוצר יכולה להשלים את חיבור Railway לפי DEPLOYMENT.md כדי שהאתר יהיה באוויר.

## 07.07.2026 — כלל עיצוב חדש: השם VaddyGo תמיד מודגש ב-UI

- **מה נעשה:** נוסף כלל UI/UX ל-ARCHITECTURE.md: השם **VaddyGo** מוצג תמיד מודגש (bold) בכל מקום שהוא מופיע ב-UI.
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
