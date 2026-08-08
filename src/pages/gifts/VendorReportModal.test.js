import { render, screen } from "@testing-library/react";
import VendorReportModal from "./VendorReportModal";

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
