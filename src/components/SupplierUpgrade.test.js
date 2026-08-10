import { render, screen } from "@testing-library/react";
import SupplierUpgrade from "./SupplierUpgrade";
import { SUPPLIER_PRO_PAYMENT_URL } from "../config/payment";

jest.mock("../config/payment", () => ({
  SUPPLIER_PRO_PAYMENT_URL: "https://pay.grow.link/supplier-pro",
}));

/*
  הרכישה מתבצעת ב-GROW (החלטת בעלת המוצר, 10.08.2026) — לא בוואטסאפ ולא בתוך
  המערכת. הבדיקות מוודאות שהכפתור מוביל לשם, ושספק שכבר רכש לא רואה אותו.
*/
const vendor = { id: 1, name: "מתנות בלב", isPro: false };

test("ספק שאינו פרו רואה מחיר וכפתור רכישה שמוביל ל-GROW", () => {
  render(<SupplierUpgrade vendor={vendor} />);

  expect(screen.getByText(/1,200/)).toBeInTheDocument();

  const link = screen.getByRole("link", { name: /רכישת מסלול פרו/ });
  expect(link).toHaveAttribute("href", SUPPLIER_PRO_PAYMENT_URL);
  // נפתח בלשונית חדשה ובלי לחשוף את העמוד שלנו לעמוד התשלום
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noreferrer");
});

test("מובהר לספק שפרטי הכרטיס אינם עוברים דרכנו", () => {
  render(<SupplierUpgrade vendor={vendor} />);
  expect(screen.getByText(/אינם עוברים דרך/)).toBeInTheDocument();
});

test("ספק שכבר רכש רואה אישור ולא כפתור רכישה", () => {
  render(<SupplierUpgrade vendor={{ ...vendor, isPro: true }} />);

  expect(screen.getByText(/מסלול פרו נרכש בהצלחה/)).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /רכישת מסלול פרו/ })
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/1,200/)).not.toBeInTheDocument();
});
