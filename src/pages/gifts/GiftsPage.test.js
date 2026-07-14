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

  const card = (await screen.findByText("מתנת ראש השנה")).closest(".gift-card");
  expect(card).toHaveTextContent("בוצע");
  expect(card).toHaveTextContent("800 ₪");
});

test("הוצאות חגים מחשבת מנוצל מול מוקצב מתקציב החג", async () => {
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

  expect(await screen.findByText("הוצאות חגים 💰")).toBeInTheDocument();
  const figures = screen.getByText((_, node) =>
    node?.classList?.contains("budget-assistant__figures")
  );
  expect(figures.textContent).toMatch(/נוצל 600 ₪ מתוך 1,600 ₪/);
  expect(figures.textContent).toMatch(/נשארו 1,000 ₪/);
});

test("אירוע 'אחר' עם הקלדה חופשית נשמר ומופיע בהוצאות חגים", async () => {
  render(<GiftsPage />);
  await screen.findByText(/עדיין אין מתנות/);

  userEvent.click(screen.getByRole("button", { name: "+ הוספת מתנה" }));
  userEvent.type(screen.getByLabelText("שם המתנה"), "מתנה למורה");
  fireEvent.change(screen.getByLabelText("אירוע (אופציונלי)"), {
    target: { value: "__other__" },
  });
  // נפתח שדה הקלדה חופשית לשם האירוע
  userEvent.type(await screen.findByLabelText("שם האירוע"), "יום המורה");
  fireEvent.change(screen.getByLabelText("תקציב (₪)"), {
    target: { value: "150" },
  });
  userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(await screen.findByText("מתנה למורה")).toBeInTheDocument();
  expect(screen.getByText("הוצאות חגים 💰")).toBeInTheDocument();
  const figures = screen.getByText((_, node) =>
    node?.classList?.contains("budget-assistant__figures")
  );
  expect(figures.textContent).toMatch(/נוצל 150 ₪/);
});

test("עוזרת התקציב מציגה כמה כבר הוצא ממתנות שבוצעו", async () => {
  localStorage.setItem(
    "vaadygo.gifts",
    JSON.stringify([
      { id: 1, name: "מתנת גננת", totalAmount: 300, status: "done", vendorId: null },
      { id: 2, name: "מתנת סייעת", totalAmount: 150, status: "planned", vendorId: null },
    ])
  );

  render(<GiftsPage />);

  // "כבר הוצאתם" סופר רק מתנות שבוצעו (300), לא מתוכננות
  const spentRow = (await screen.findByText("כבר הוצאתם")).closest(
    ".budget-rec__row"
  );
  expect(spentRow.textContent).toMatch(/300 ₪/);
  expect(screen.getByText("נשאר מהמומלץ")).toBeInTheDocument();
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

test("דף ספק מציג כפתור וואטסאפ, רשת חברתית ותמונת מוצר", async () => {
  localStorage.setItem(
    "vaadygo.vendors",
    JSON.stringify([
      {
        id: 7,
        name: "מתנות בלב",
        catalogUrl: "",
        whatsApp: "054-1234567",
        products: [
          { name: "כוס מעוצבת", price: 30, imageUrl: "https://x.test/cup.jpg" },
        ],
        socialLinks: [
          { label: "אינסטגרם", url: "https://instagram.com/matanotbalev" },
        ],
      },
    ])
  );

  render(<GiftsPage />);

  userEvent.click(await screen.findByRole("button", { name: /מתנות בלב/ }));

  // כפתור וואטסאפ בונה קישור wa.me עם קידומת בינלאומית (0 מוביל → 972)
  const whatsapp = await screen.findByRole("link", { name: /וואטסאפ/ });
  expect(whatsapp).toHaveAttribute("href", "https://wa.me/972541234567");
  // רשת חברתית
  expect(screen.getByRole("link", { name: "אינסטגרם" })).toHaveAttribute(
    "href",
    "https://instagram.com/matanotbalev"
  );
  // תמונת מוצר
  expect(screen.getByAltText("כוס מעוצבת")).toHaveAttribute(
    "src",
    "https://x.test/cup.jpg"
  );
});
