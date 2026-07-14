/*
  financeContext — תמצית כספית אמיתית של הוועד, שנשלחת לעוזרת ה-AI כרקע כדי
  שתדע לענות לפי המצב בפועל (יתרה, גבייה לפי קטגוריה, הוצאות לפי קטגוריה),
  ולא "תמציא" מספרים. נבנה מהדשבורד ומרשימת ההוצאות. נכשל בשקט (מחזיר "")
  אם השרת לא זמין — אז העוזרת פשוט עובדת בלי המספרים.
*/
import { loadDashboard } from "./dashboardService";
import { getExpenses } from "./expensesService";
import { paymentMethodLabel } from "./paymentMethods";
import { formatShekels } from "./format";

export async function buildFinanceSummary() {
  try {
    const [dash, expenses] = await Promise.all([
      loadDashboard().catch(() => null),
      getExpenses().catch(() => []),
    ]);

    const lines = [];

    if (dash) {
      lines.push(
        `יעד גבייה: ${formatShekels(dash.collectionTarget)} · נגבה: ${formatShekels(
          dash.collectedTotal
        )} · חוב פתוח: ${formatShekels(dash.openDebt)} (${dash.progressPercent}% הושלם)`
      );
      lines.push(`יתרת הקופה: ${formatShekels(dash.boxBalance)}`);

      if (dash.byPaymentMethod?.length) {
        const methods = dash.byPaymentMethod
          .map((m) => `${paymentMethodLabel(m.method)} ${formatShekels(m.amount)}`)
          .join(", ");
        lines.push(`יתרה לפי אמצעי: ${methods}`);
      }
      if (dash.byCategory?.length) {
        const cats = dash.byCategory
          .map(
            (c) =>
              `${c.name} — נגבה ${formatShekels(c.collectedAmount)} מתוך ${formatShekels(
                c.targetAmount
              )}`
          )
          .join("; ");
        lines.push(`גבייה לפי קטגוריה: ${cats}`);
      }
    }

    if (expenses?.length) {
      const byCategory = {};
      let total = 0;
      for (const e of expenses) {
        const key = e.category?.trim() || "ללא קטגוריה";
        byCategory[key] = (byCategory[key] || 0) + Number(e.amount || 0);
        total += Number(e.amount || 0);
      }
      const catLine = Object.entries(byCategory)
        .map(([name, sum]) => `${name} ${formatShekels(sum)}`)
        .join("; ");
      lines.push(`הוצאות לפי קטגוריה: ${catLine}`);
      lines.push(`סך ההוצאות: ${formatShekels(total)}`);
    }

    if (lines.length === 0) {
      return "";
    }
    return `המצב הכספי הנוכחי של הוועד (מספרים אמיתיים מהמערכת — אפשר להסתמך עליהם):\n${lines.join(
      "\n"
    )}`;
  } catch {
    return "";
  }
}
