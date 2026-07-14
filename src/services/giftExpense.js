import { getExpenses, createExpense, deleteExpense } from "./expensesService";

/*
  giftExpense — מסנכרן מתנה שסומנה "בוצע" עם יתרת הקופה. מתנה שבוצעה נרשמת
  כהוצאה בסכום המתנה ובאמצעי התשלום שנבחר, כך שהיא מקטינה גם את היתרה הכללית
  וגם את קוביית האמצעי (ביט/פייבוקס/מזומן). מתנה שאינה "בוצע" — אין לה הוצאה.
  הקישור בין המתנה להוצאה נעשה לפי תיאור ההוצאה ("מתנה: <שם>").
*/
export function giftExpenseDescription(name) {
  return `מתנה: ${name}`;
}

/*
  מסנכרן את ההוצאה של המתנה מול הסטטוס שלה. prevName מאפשר לנקות הוצאה
  ישנה גם כששם המתנה השתנה. עובד בשקט גם כשאין שרת (לא חוסם שמירת מתנה).
*/
export async function syncGiftExpense({ prevName, gift, method }) {
  const isDone = gift.status === "done";
  const descriptions = new Set(
    [
      prevName && giftExpenseDescription(prevName),
      giftExpenseDescription(gift.name),
    ].filter(Boolean)
  );

  try {
    // מסירים כל הוצאה קודמת של המתנה (ביטול "בוצע", שינוי סכום/אמצעי/שם)
    const expenses = await getExpenses();
    await Promise.all(
      expenses
        .filter((e) => descriptions.has(e.description))
        .map((e) => deleteExpense(e.id))
    );

    // רושמים הוצאה חדשה רק אם המתנה בוצעה ויש לה סכום
    if (isDone && Number(gift.totalAmount) > 0) {
      await createExpense({
        amount: Number(gift.totalAmount),
        method: method || "cash",
        description: giftExpenseDescription(gift.name),
      });
    }
  } catch {
    // אין שרת/הוצאות זמינות — לא חוסמים את שמירת המתנה
  }
}
