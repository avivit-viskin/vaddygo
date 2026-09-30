import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BulkPaymentModal, { categoryOptions } from "./BulkPaymentModal";
import {
  getStudentPayments,
  saveStudentPayment,
} from "../../services/paymentsService";

jest.mock("../../services/paymentsService", () => ({
  ...jest.requireActual("../../services/paymentsService"),
  getStudentPayments: jest.fn(),
  saveStudentPayment: jest.fn(),
}));

/*
  שני ילדים בצהרון ואחד שלא. לילדי הצהרון יש שורת תשלום נוספת — וזה בדיוק
  המקרה שבו סימון מרובה יכול לגבות כסף מהילד הלא-נכון אם לא נזהרים.
*/
const BASE = { collectionCategoryId: 1, categoryName: "ועד הורים", amount: 200 };
const ADDON = { collectionCategoryId: 2, categoryName: "תוספת קבוצה — צהרון", amount: 10 };

const students = [
  { id: 11, firstName: "נועה", lastName: "כהן" },
  { id: 12, firstName: "איתי", lastName: "לוי" },
  { id: 13, firstName: "מאיה", lastName: "פרץ" },
];

beforeEach(() => {
  jest.clearAllMocks();
  getStudentPayments.mockImplementation((id) =>
    Promise.resolve(id === 13 ? [BASE] : [BASE, ADDON])
  );
  saveStudentPayment.mockResolvedValue({});
});

function open(ids = [11, 12, 13]) {
  return render(
    <BulkPaymentModal
      isOpen
      studentIds={ids}
      students={students}
      onClose={() => {}}
    />
  );
}

test("מציג את הקטגוריות שקיימות אצל הנבחרים", async () => {
  open();
  expect(await screen.findByLabelText("קטגוריה")).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /ועד הורים/ })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /צהרון/ })).toBeInTheDocument();
});

test("קטגוריה משותפת — כולם נרשמים", async () => {
  open();
  await screen.findByLabelText("קטגוריה");
  await userEvent.click(screen.getByRole("button", { name: "רישום התשלום" }));

  await waitFor(() => expect(saveStudentPayment).toHaveBeenCalledTimes(3));
  expect(saveStudentPayment).toHaveBeenCalledWith(11, 1, {
    isPaid: true, bitAmount: 0, payBoxAmount: 0, cashAmount: 200, cardAmount: 0,
  });
  expect(await screen.findByText(/נרשם ל-3 תלמידים/)).toBeInTheDocument();
});

/* הלב של הרכיב: מי שאינו בקבוצה לא משלם את התוספת שלה. */
test("תוספת קבוצה — רק מי שבקבוצה נרשם, והשאר מדולגים ונספרים", async () => {
  open();
  await screen.findByLabelText("קטגוריה");
  await userEvent.selectOptions(
    screen.getByLabelText("קטגוריה"),
    "תוספת קבוצה — צהרון"
  );

  // נאמר לפני הלחיצה, לא אחריה
  expect(screen.getByText(/ל-1 מהמסומנים אין את הקטגוריה הזו/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "רישום התשלום" }));
  await waitFor(() => expect(saveStudentPayment).toHaveBeenCalledTimes(2));
  expect(saveStudentPayment).not.toHaveBeenCalledWith(13, expect.anything(), expect.anything());
  expect(await screen.findByText(/נרשם ל-2 תלמידים/)).toBeInTheDocument();
});

test("הסכום מתעדכן לפי הקטגוריה, ואפשר לשנות אותו", async () => {
  open();
  await screen.findByLabelText("קטגוריה");
  expect(screen.getByLabelText("סכום לכל ילד")).toHaveValue(200);

  await userEvent.selectOptions(screen.getByLabelText("קטגוריה"), "תוספת קבוצה — צהרון");
  expect(screen.getByLabelText("סכום לכל ילד")).toHaveValue(10);
});

test("סכום אפס נחסם — סימון 'שולם 0' הוא כמעט תמיד טעות", async () => {
  open();
  await screen.findByLabelText("קטגוריה");
  await userEvent.clear(screen.getByLabelText("סכום לכל ילד"));
  await userEvent.type(screen.getByLabelText("סכום לכל ילד"), "0");
  await userEvent.click(screen.getByRole("button", { name: "רישום התשלום" }));

  expect(await screen.findByText(/סכום גדול מאפס/)).toBeInTheDocument();
  expect(saveStudentPayment).not.toHaveBeenCalled();
});

/* כסף: "2 נכשלו" בלי לדעת מי, גרוע יותר מלא לעשות כלום. */
test("כישלון נקודתי מדווח בשם התלמיד", async () => {
  saveStudentPayment.mockImplementation((id) =>
    id === 12 ? Promise.reject(new Error("נפל")) : Promise.resolve({})
  );
  open();
  await screen.findByLabelText("קטגוריה");
  await userEvent.click(screen.getByRole("button", { name: "רישום התשלום" }));

  expect(await screen.findByText(/איתי לוי/)).toBeInTheDocument();
  expect(screen.getByText(/נרשם ל-2 תלמידים/)).toBeInTheDocument();
});

test("איחוד הקטגוריות מדלג על כפילויות וסופר כמה ילדים בכל אחת", () => {
  const map = new Map([
    [11, [BASE, ADDON]],
    [12, [BASE, ADDON]],
    [13, [BASE]],
  ]);
  expect(categoryOptions(map)).toEqual([
    { name: "ועד הורים", amount: 200, count: 3 },
    { name: "תוספת קבוצה — צהרון", amount: 10, count: 2 },
  ]);
});
