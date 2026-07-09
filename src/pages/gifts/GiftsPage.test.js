import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GiftsPage from "../GiftsPage";

/*
  טסטים למסך המתנות (UI_SPEC ס' 12). אין שרת בסביבת הטסטים, ולכן השירותים
  נופלים ל-localStorage — נבדק מסלול ה-fallback המקומי.
*/

beforeEach(() => {
  localStorage.clear();
});

test("מצב ריק: הזמנה להוסיף מתנה ראשונה", async () => {
  render(<GiftsPage />);
  expect(await screen.findByText(/עדיין אין מתנות/)).toBeInTheDocument();
});

test("הוספת מתנה מציגה אותה ברשימה עם סטטוס וסכום", async () => {
  render(<GiftsPage />);
  await screen.findByText(/עדיין אין מתנות/);

  userEvent.click(screen.getByRole("button", { name: "+ הוספת מתנה" }));
  userEvent.type(screen.getByLabelText("שם המתנה"), "מתנת ראש השנה");
  fireEvent.change(screen.getByLabelText("תקציב (₪)"), {
    target: { value: "800" },
  });
  fireEvent.change(screen.getByLabelText("סטטוס"), {
    target: { value: "done" },
  });
  userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(await screen.findByText("מתנת ראש השנה")).toBeInTheDocument();
  expect(screen.getByText("בוצע")).toBeInTheDocument();
  expect(screen.getByText("800 ₪")).toBeInTheDocument();
});

test("עוזרת תקציבית מחשבת מנוצל מול מוקצב מתקציב החג", async () => {
  localStorage.setItem(
    "vaadygo.gifts",
    JSON.stringify([
      {
        id: 1,
        name: "מתנת חנוכה",
        holidayKey: "חנוכה|5787",
        holidayName: "חנוכה",
        totalAmount: 600,
        status: "planned",
        vendorId: null,
      },
    ])
  );
  localStorage.setItem(
    "vaadygo.holidayBudgets",
    JSON.stringify({ "חנוכה|5787": 1600 })
  );

  render(<GiftsPage />);

  expect(await screen.findByText("עוזרת תקציבית 💡")).toBeInTheDocument();
  const figures = screen.getByText((_, node) =>
    node?.classList?.contains("budget-assistant__figures")
  );
  expect(figures.textContent).toMatch(/נוצל 600 ₪ מתוך 1,600 ₪/);
  expect(figures.textContent).toMatch(/נשארו 1,000 ₪/);
});

test("פתיחת דף ספק מציגה את המוצרים והמחירים", async () => {
  localStorage.setItem(
    "vaadygo.vendors",
    JSON.stringify([
      {
        id: 5,
        name: "מתנות בלב",
        catalogUrl: "",
        products: [{ name: "כוס מעוצבת", price: 30 }],
      },
    ])
  );

  render(<GiftsPage />);

  const vendorButton = await screen.findByRole("button", {
    name: /מתנות בלב/,
  });
  userEvent.click(vendorButton);

  expect(await screen.findByText("כוס מעוצבת")).toBeInTheDocument();
  expect(screen.getByText("30 ₪")).toBeInTheDocument();
});
