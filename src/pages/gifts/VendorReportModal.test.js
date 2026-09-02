import { render, screen } from "@testing-library/react";
import VendorReportModal from "./VendorReportModal";
import { getVendorLeads } from "../../services/vendorsService";

// מבט המנהלת טוען את הפניות מנקודת-קצה SuperAdmin — ממקים כדי לא לפנות לרשת.
jest.mock("../../services/vendorsService", () => ({
  getVendorLeads: jest.fn(),
}));

// resetMocks:true (ברירת המחדל של CRA) מנקה מימוש בין טסטים — קובעים ברירת מחדל
// (רשימה ריקה) לפני כל טסט, כדי שה-effect לא יקרא then על undefined.
beforeEach(() => {
  getVendorLeads.mockResolvedValue([]);
});

const vendor = {
  id: 1,
  name: "מתנות בלב",
  whatsApp: "054-1234567",
  views: 40,
  leads: 6,
  products: [{ name: "כוס", price: 25, folder: "פסח" }],
};

test("לא מוצג כשלא נבחר ספק", () => {
  const { container } = render(
    <VendorReportModal vendor={null} onClose={() => {}} />
  );
  expect(container).toBeEmptyDOMElement();
});

test("מציג התקדמות, סטטיסטיקות וכפתורי שיתוף", () => {
  render(<VendorReportModal vendor={vendor} onClose={() => {}} />);

  expect(
    screen.getByRole("dialog", { name: "דוח ספק — מתנות בלב" })
  ).toBeInTheDocument();

  // 2 מתוך 5 הושלמו (וואטסאפ + מוצר ראשון) = 40%
  expect(screen.getByText("השלמת הכרטיס: 2 מתוך 5 (40%)")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");

  // הסטטיסטיקות מגיעות מרכיב הדוחות המשותף
  expect(screen.getByText("40")).toBeInTheDocument();
  expect(screen.getByText("צפיות")).toBeInTheDocument();
  expect(screen.getByText("פניות")).toBeInTheDocument();

  // שיתוף — קישור וואטסאפ עם הדוח מוכן, והעתקה ללוח
  const waLink = screen.getByRole("link", { name: /שיתוף הדוח בוואטסאפ/ });
  expect(waLink).toHaveAttribute("href", expect.stringContaining("wa.me/9725"));
  expect(waLink.getAttribute("href")).toContain(encodeURIComponent("דוח ספק"));
  expect(
    screen.getByRole("button", { name: /העתקת הדוח/ })
  ).toBeInTheDocument();
});

test("מבט המנהלת: מציג מי פנה לספק — שם וטלפון", async () => {
  getVendorLeads.mockResolvedValueOnce([
    {
      id: 7,
      contactName: "דנה כהן",
      contactPhone: "050-1112222",
      committeeName: "גן רימון",
      subject: "בלוני הליום",
      createdAt: "2026-08-01T00:00:00Z",
    },
  ]);

  render(<VendorReportModal vendor={vendor} onClose={() => {}} />);

  expect(await screen.findByText("מי פנה לספק (1)")).toBeInTheDocument();
  expect(screen.getByText("דנה כהן")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /050-1112222/ })
  ).toBeInTheDocument();
});
