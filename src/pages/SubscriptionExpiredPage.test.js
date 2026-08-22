import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SubscriptionExpiredPage from "./SubscriptionExpiredPage";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

/*
  המסך הזה נתפס ברגע לחוץ: המשתמשת נחסמה ולא יודעת מה קרה לנתונים שלה.
  הבדיקות מוודאות את שני הדברים שהיא צריכה לראות מיד — על איזה מוסד מדובר,
  ושיש דרך קדימה שאינה תשלום.
*/
function renderPage() {
  return render(
    <MemoryRouter>
      <SubscriptionExpiredPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test("מציג את שם המוסד שצריך לחדש, ולא הודעה גנרית", () => {
  localStorage.setItem(
    "vaadygo.institutions",
    JSON.stringify([{ id: "a", name: "גן הרימון" }])
  );

  renderPage();

  expect(screen.getAllByText(/גן הרימון/).length).toBeGreaterThan(0);
  expect(
    screen.getByRole("button", { name: /חידוש המנוי עבור גן הרימון/ })
  ).toBeInTheDocument();
});

test("בכמה מוסדות — נאמר שהחידוש מפעיל את כולם, בשמות", () => {
  localStorage.setItem(
    "vaadygo.institutions",
    JSON.stringify([
      { id: "a", name: "גן הרימון" },
      { id: "b", name: "גן התמר" },
    ])
  );

  renderPage();

  expect(screen.getByText(/גן התמר/)).toBeInTheDocument();
  expect(screen.getByText(/יפעיל מחדש את כל המוסדות/)).toBeInTheDocument();
});

/*
  קודם היו רק "חידוש" ו"התנתקות" — מי שלא רצתה לשלם עכשיו נשארה בלי מסלול.
*/
test("יש מסלול הרשמה מחדש, עם אזהרה שהנתונים אינם עוברים", async () => {
  localStorage.setItem(
    "vaadygo.institutions",
    JSON.stringify([{ id: "a", name: "גן הרימון" }])
  );
  localStorage.setItem("vaadygo.token", "t");

  renderPage();

  expect(screen.getByText(/לא יעברו אליו/)).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole("button", { name: /הרשמה מחדש/ })
  );

  // מתנתקים לפני ההרשמה, אחרת מסך ההרשמה נטען עם טוקן שפג
  expect(localStorage.getItem("vaadygo.token")).toBeNull();
  expect(mockNavigate).toHaveBeenCalledWith("/register");
});

/*
  באג אמיתי שנתפס בשימוש: מי שנחת על המסך הזה בקישור ישיר נשאר בלי מוצא —
  "התנתקות" מחזירה לכניסה, וכניסה מחזירה לאותו מקום. נראה בדיוק כמו חסימה
  שלא הוסרה, למרות שהחסימה כבר לא קיימת.
*/
test("משתמשת מחוברת מקבלת דרך חזרה למערכת", async () => {
  localStorage.setItem("vaadygo.token", "t");
  renderPage();

  await userEvent.click(screen.getByRole("button", { name: /חזרה למערכת/ }));
  expect(mockNavigate).toHaveBeenCalledWith("/");
});

test("מי שאינה מחוברת לא רואה 'חזרה למערכת' (אין לאן לחזור)", () => {
  renderPage();
  expect(screen.queryByRole("button", { name: /חזרה למערכת/ })).toBeNull();
});

test("נאמר במפורש שהנתונים לא נמחקו", () => {
  renderPage();
  expect(screen.getByText(/שמורים ומחכים לך/)).toBeInTheDocument();
  expect(screen.getByText(/שום דבר לא נמחק/)).toBeInTheDocument();
});

test("בלי מוסדות שמורים — עדיין מוצג מסך תקין ולא ריק", () => {
  renderPage();
  expect(screen.getByText(/תוקף המנוי שלך/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /הרשמה מחדש/ })).toBeInTheDocument();
});
