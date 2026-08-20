/*
  supplierTourSteps — התוכן והסדר של סיור ההיכרות בפורטל הספקים.

  בניגוד לצד הוועד (routes), פורטל הספק מנווט בטאבים פנימיים ובמצבי-קומפוננטה.
  לכן לכל שלב מציינים:
    - tab:    לאיזה טאב לעבור (home/products/payments/preview/settings).
    - action: "report" — לפתוח את מודאל דוח הספק (במקום טאב).
  ה-SupplierEditPage מקבל את השלב ומעביר את המסך למצב הנכון, ואז הסיור מדגיש
  את selector. אם אלמנט לא נמצא — החלונית מופיעה במרכז (נפילה רכה).
*/
export const SUPPLIER_TOUR_STEPS = [
  {
    key: "sup-nav",
    tab: "home",
    selector: '[data-tour="sup-nav"]',
    title: "התפריט למעלה",
    body: "מכאן עוברים בין המסכים של הפורטל: בית, מוצרים, תשלומים, רשתות ותצוגה.",
  },
  {
    key: "sup-stats",
    tab: "home",
    selector: '[data-tour="sup-stats"]',
    title: "דף הבית — פניות וצפיות",
    body: "כאן רואים כמה פניות קיבלת מוועדי הורים, וכמה צפיות היו לכרטיס שלך. כך יודעים מה עובד.",
  },
  {
    key: "add-product",
    tab: "products",
    selector: '[data-tour="add-product"]',
    title: "מוצרים — הוספת מוצר",
    body: "במסך המוצרים מוסיפים מוצר — בצילום, מהגלריה או בהזנה ידנית. כל שינוי שתשמרו מופיע מיד לוועדים.",
  },
  {
    key: "sup-payments",
    tab: "payments",
    selector: '[data-tour="sup-payments"]',
    title: "אמצעי תשלום",
    body: "כאן בוחרים איך משלמים לך — ביט, פייבוקס, אשראי או העברה בנקאית — ואת פריסת התשלומים.",
  },
  {
    key: "sup-preview",
    tab: "preview",
    selector: '[data-tour="sup-preview"]',
    title: "תצוגה — איך זה נראה לוועד",
    body: "כך בדיוק נראה הכרטיס שלך לוועדי ההורים באפליקציה. כדאי להציץ ולוודא שהכול נראה מזמין.",
  },
  {
    key: "sup-settings",
    tab: "settings",
    selector: '[data-tour="sup-settings"]',
    title: "הגדרות משתמש",
    body: "פרטי העסק והחשבון — שם, עיר, קטגוריה ומידע נוסף שהוועדים רואים בכרטיס שלך.",
  },
  {
    key: "sup-report",
    action: "report",
    selector: '[data-tour="sup-report"]',
    title: "דוח ספק",
    body: "הדוח מסכם צפיות, פניות ומוצרים לאורך זמן — כדי לראות מה עובד. זהו, סיימנו את הסיור! 🎉",
  },
];
