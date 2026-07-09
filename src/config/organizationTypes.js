/*
  organizationTypes.js — מפת התוויות של המערכת: מקור האמת היחיד לשמות השדות לפי סוג הארגון.

  עקרון-על (ARCHITECTURE.md → "מערכת גנרית לכל ארגון"): VaadyGo אינה מוגבלת לגנים/בתי ספר.
  המודל בשרת גנרי (Organization, Members/יחידות, מונה, שם ארגון); כאן יושבות **רק
  מחרוזות התצוגה** שמשתנות לפי סוג הארגון. מסך אינו כותב "תלמיד"/"שם הגן" בקשיחות —
  הוא שואב את התווית מכאן לפי סוג הארגון של המשתמשת.

  הרחבה לסוג ארגון חדש = הוספת רשומה אחת למטה, בלי לגעת בשום קוד אחר.
  הגן הוא Vertical #1 ולכן מוגדר במלואו; שאר הסוגים הם שלד ראשוני להרחבה.
*/

export const ORG_TYPES = {
  kindergarten: {
    id: "kindergarten",
    typeLabel: "גן",
    orgNameLabel: "שם הגן",
    memberSingular: "תלמיד",
    memberPlural: "תלמידים",
    countLabel: "מספר ילדים",
    subgroupLabel: "קבוצה",
    subgroupExamples: ["תינוקייה", "פעוטות", "בוגרים", "חובה"],
  },
  school: {
    id: "school",
    typeLabel: "בית ספר",
    orgNameLabel: "שם בית הספר",
    memberSingular: "תלמיד",
    memberPlural: "תלמידים",
    countLabel: "מספר תלמידים",
    subgroupLabel: "כיתה",
    subgroupExamples: ["א", "ב", "ג", "ד", "ה", "ו"],
  },
  building: {
    id: "building",
    typeLabel: "ועד בית",
    orgNameLabel: "שם/כתובת הבניין",
    memberSingular: "דייר",
    memberPlural: "דיירים",
    countLabel: "מספר דירות",
    subgroupLabel: "קומה",
    subgroupExamples: [],
  },
  office: {
    id: "office",
    typeLabel: "משרד",
    orgNameLabel: "שם המשרד",
    memberSingular: "עובד",
    memberPlural: "עובדים",
    countLabel: "מספר עובדים",
    subgroupLabel: "מחלקה",
    subgroupExamples: [],
  },
  hospitalWard: {
    id: "hospitalWard",
    typeLabel: "מחלקה בבית חולים",
    orgNameLabel: "שם המחלקה",
    memberSingular: "מטופל",
    memberPlural: "מטופלים",
    countLabel: "מספר מיטות",
    subgroupLabel: "צוות",
    subgroupExamples: [],
  },
  bank: {
    id: "bank",
    typeLabel: "בנק/סניף",
    orgNameLabel: "שם הסניף",
    memberSingular: "לקוח",
    memberPlural: "לקוחות",
    countLabel: "מספר לקוחות",
    subgroupLabel: "צוות",
    subgroupExamples: [],
  },
};

/* סוג ברירת המחדל — הגן, מקרה השימוש הראשון. */
export const DEFAULT_ORG_TYPE = "kindergarten";

/*
  getOrgTerms — מחזיר את מפת התוויות של סוג ארגון נתון.
  קלט לא מוכר או ריק → נופל לברירת המחדל (הגן), כדי שהתצוגה לעולם לא תישבר.
*/
export function getOrgTerms(typeId) {
  return ORG_TYPES[typeId] || ORG_TYPES[DEFAULT_ORG_TYPE];
}

/* רשימת כל הסוגים — לשימוש בבורר סוג הארגון באונבורדינג (dropdown). */
export const ORG_TYPE_OPTIONS = Object.values(ORG_TYPES).map((t) => ({
  value: t.id,
  label: t.typeLabel,
}));
