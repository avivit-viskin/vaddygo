import { syncGiftExpense, giftExpenseDescription } from "./giftExpense";
import { getExpenses, createExpense, deleteExpense } from "./expensesService";

jest.mock("./expensesService", () => ({
  getExpenses: jest.fn(),
  createExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  getExpenses.mockResolvedValue([]);
  createExpense.mockResolvedValue({});
  deleteExpense.mockResolvedValue();
});

test('מתנה שסומנה "בוצע" נרשמת כהוצאה בסכום ובאמצעי שנבחר', async () => {
  await syncGiftExpense({
    gift: { name: "מתנה לגננת", totalAmount: 200, status: "done" },
    method: "bit",
  });
  expect(createExpense).toHaveBeenCalledWith({
    amount: 200,
    method: "bit",
    category: "מתנות סוף שנה",
    description: giftExpenseDescription("מתנה לגננת"),
  });
});

test('מתנת חג שבוצעה נרשמת כהוצאה בקטגוריית "חגים"', async () => {
  await syncGiftExpense({
    gift: {
      name: "מתנה לחנוכה",
      totalAmount: 300,
      status: "done",
      holidayName: "חנוכה",
    },
    method: "cash",
  });
  expect(createExpense).toHaveBeenCalledWith({
    amount: 300,
    method: "cash",
    category: "חגים",
    description: giftExpenseDescription("מתנה לחנוכה"),
  });
});

test('מתנה שאינה "בוצע" — לא נרשמת הוצאה', async () => {
  await syncGiftExpense({
    gift: { name: "מתנה לגננת", totalAmount: 200, status: "planned" },
    method: "bit",
  });
  expect(createExpense).not.toHaveBeenCalled();
});

test('ביטול "בוצע" מוחק את ההוצאה של המתנה', async () => {
  getExpenses.mockResolvedValue([
    { id: 7, description: giftExpenseDescription("מתנה לגננת"), amount: 200 },
    { id: 8, description: "הוצאה אחרת", amount: 50 },
  ]);
  await syncGiftExpense({
    gift: { name: "מתנה לגננת", totalAmount: 200, status: "planned" },
    method: "cash",
  });
  expect(deleteExpense).toHaveBeenCalledWith(7); // רק ההוצאה של המתנה
  expect(deleteExpense).not.toHaveBeenCalledWith(8);
  expect(createExpense).not.toHaveBeenCalled();
});

test("שינוי שם מתנה שבוצעה — מוחק את ההוצאה הישנה ורושם מחדש", async () => {
  getExpenses.mockResolvedValue([
    { id: 3, description: giftExpenseDescription("שם ישן"), amount: 100 },
  ]);
  await syncGiftExpense({
    prevName: "שם ישן",
    gift: { name: "שם חדש", totalAmount: 100, status: "done" },
    method: "paybox",
  });
  expect(deleteExpense).toHaveBeenCalledWith(3);
  expect(createExpense).toHaveBeenCalledWith({
    amount: 100,
    method: "paybox",
    category: "מתנות סוף שנה",
    description: giftExpenseDescription("שם חדש"),
  });
});
