import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SupplierUpgrade from "./SupplierUpgrade";
import { startVendorProCheckout } from "../services/vendorsService";

jest.mock("../services/vendorsService", () => ({
  startVendorProCheckout: jest.fn(),
}));

/*
  שדרוג הספק עבר מ"דברו איתנו בוואטסאפ" לתשלום בסליקה. הדבר הקריטי: הכפתור
  מפנה לעמוד התשלום של חברת הסליקה — ולא פותח פרו בעצמו (הפתיחה נעשית רק
  אחרי אישור משרת-לשרת).
*/
const vendor = { id: 1, name: "מתנות בלב", isPro: false };

beforeEach(() => {
  jest.clearAllMocks();
  delete window.location;
  window.location = { href: "", origin: "https://app.test" };
});

test("ספק שאינו פרו רואה מחיר וכפתור תשלום מאובטח", () => {
  render(<SupplierUpgrade vendor={vendor} token="tok1" />);

  expect(screen.getByText(/1,200/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /מעבר לתשלום מאובטח/ })
  ).toBeInTheDocument();
  // מובהר שפרטי הכרטיס לא עוברים דרכנו
  expect(screen.getByText(/אינם עוברים דרך VaddyGo/)).toBeInTheDocument();
});

test("לחיצה מעבירה לעמוד התשלום שהשרת החזיר", async () => {
  startVendorProCheckout.mockResolvedValue("https://pay.test/abc");
  render(<SupplierUpgrade vendor={vendor} token="tok1" />);

  userEvent.click(screen.getByRole("button", { name: /מעבר לתשלום מאובטח/ }));

  await waitFor(() =>
    expect(startVendorProCheckout).toHaveBeenCalledWith("tok1")
  );
  await waitFor(() => expect(window.location.href).toBe("https://pay.test/abc"));
});

test("כשל בפתיחת התשלום מוצג ולא מפיל את המסך", async () => {
  startVendorProCheckout.mockRejectedValue(new Error("השרת אינו זמין"));
  render(<SupplierUpgrade vendor={vendor} token="tok1" />);

  userEvent.click(screen.getByRole("button", { name: /מעבר לתשלום מאובטח/ }));

  expect(await screen.findByText("השרת אינו זמין")).toBeInTheDocument();
  expect(window.location.href).toBe("");
});

test("ספק שכבר פרו רואה אישור ולא כפתור תשלום", () => {
  render(<SupplierUpgrade vendor={{ ...vendor, isPro: true }} token="tok1" />);

  expect(screen.getByText(/מסלול פרו נרכש בהצלחה/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /מעבר לתשלום מאובטח/ })
  ).not.toBeInTheDocument();
});
