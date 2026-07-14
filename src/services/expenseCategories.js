/*
  expenseCategories — האפשרויות ל"על מה יורד הכסף?" בעדכון היתרה.
  שתי קבוצות: (1) קטגוריות הגבייה שהוגדרו בהגדרות הראשוניות (הזנה/ועד/חוגים...),
  (2) סוגי הוצאה קבועים (חגים / ימי הולדת / מתנות סוף שנה / בלת"מ).
  משמש גם לתצוגה המסונכרנת לפי קטגוריה וגם למודעות הכספית של עוזרת ה-AI.
*/
import { getGroups } from "./groupsService";
import { getActiveServerGroupId } from "./institutionsService";

/* סוגי הוצאה קבועים — מעבר לקטגוריות הגבייה של הגן */
export const EXPENSE_TYPES = [
  "חגים",
  "ימי הולדת צוות",
  "ימי הולדת ילדים",
  "מתנות סוף שנה",
  'בלת"מ',
];

/*
  שמות קטגוריות הגבייה של המוסד הפעיל (לפי הבעלות בשרת). נופל לרשימה ריקה
  בשקט אם השרת לא זמין — כך שקבוצת "סוגי ההוצאה" עדיין תעבוד.
*/
export async function getCollectionCategoryNames() {
  try {
    const groups = await getGroups();
    if (!groups || groups.length === 0) {
      return [];
    }
    const activeId = getActiveServerGroupId();
    const active = groups.find((g) => g.id === activeId) ?? groups[0];
    return (active?.categories ?? [])
      .map((c) => c.name)
      .filter((name) => name && name.trim());
  } catch {
    return [];
  }
}
