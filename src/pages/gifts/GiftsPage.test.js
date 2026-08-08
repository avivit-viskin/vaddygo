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

test("אירוע 'אחר' עם הקלדה חופשית נשמר ומופיע ברשימת המתנות", async () => {
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

  // המוצרים נמצאים בתוך תיקייה — מוצר בלי תיקייה מקובץ תחת "כללי"
  userEvent.click(await screen.findByRole("button", { name: /כללי/ }));

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

  // וואטסאפ + רשת חברתית מוצגים ברמת רשימת התיקיות
  // כפתור וואטסאפ בונה קישור wa.me עם קידומת בינלאומית (0 מוביל → 972)
  const whatsapp = await screen.findByRole("link", { name: /WhatsApp/i });
  // הקישור מוביל למספר הבינלאומי; יכול לכלול ?text=... (הודעה מוכנה) — בודקים תחילית
  expect(whatsapp.getAttribute("href")).toMatch(
    /^https:\/\/wa\.me\/972541234567(\?|$)/
  );
  // רשת חברתית
  expect(screen.getByRole("link", { name: "אינסטגרם" })).toHaveAttribute(
    "href",
    "https://instagram.com/matanotbalev"
  );

  // תמונת המוצר נמצאת בתוך התיקייה
  userEvent.click(screen.getByRole("button", { name: /כללי/ }));
  expect(await screen.findByAltText("כוס מעוצבת")).toHaveAttribute(
    "src",
    "https://x.test/cup.jpg"
  );
});

test("סינון ספקים לפי מיקום מציג רק את הספקים מאותה עיר", async () => {
  localStorage.setItem(
    "vaadygo.vendors",
    JSON.stringify([
      { id: 1, name: "מתנות בלב", city: "חיפה", products: [] },
      { id: 2, name: "בלונים ועוד", city: "תל אביב", products: [] },
    ])
  );

  render(<GiftsPage />);

  // לפני סינון — שני הספקים מוצגים
  expect(
    await screen.findByRole("button", { name: /מתנות בלב/ })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /בלונים ועוד/ })
  ).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "חיפה" }));

  expect(screen.getByRole("button", { name: /מתנות בלב/ })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /בלונים ועוד/ })
  ).not.toBeInTheDocument();
});

test("סינון קטגוריה ומיקום פועלים יחד, ומצב ריק כשאין התאמה", async () => {
  localStorage.setItem(
    "vaadygo.vendors",
    JSON.stringify([
      { id: 1, name: "מתנות בלב", category: "מתנות", city: "חיפה", products: [] },
      {
        id: 2,
        name: "בלונים ועוד",
        category: "הסעדה",
        city: "תל אביב",
        products: [],
      },
    ])
  );

  render(<GiftsPage />);
  await screen.findByRole("button", { name: /מתנות בלב/ });

  // קטגוריה "מתנות" (חיפה) יחד עם מיקום "תל אביב" — אין ספק שעונה לשניהם
  userEvent.click(screen.getByRole("button", { name: "מתנות" }));
  userEvent.click(screen.getByRole("button", { name: "תל אביב" }));

  expect(
    screen.queryByRole("button", { name: /מתנות בלב/ })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /בלונים ועוד/ })
  ).not.toBeInTheDocument();
  expect(screen.getByText(/אין ספקים שמתאימים לסינון/)).toBeInTheDocument();
});
