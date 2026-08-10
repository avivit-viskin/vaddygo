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
// ברירת המחדל בבדיקות: סליקה מחוברת (proCheckoutAvailable) — ובלעדיה יש
// בדיקה נפרדת שמוודאת שהכפתור אינו מוצג כלל.
const vendor = {
  id: 1,
  name: "מתנות בלב",
  isPro: false,
  proCheckoutAvailable: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  delete window.location;
  window.location = { href: "", origin: "https://app.test" };
});

test("ספק שאינו פרו רואה מחיר וכפתור רכישה בתשלום מאובטח", () => {
  render(<SupplierUpgrade vendor={vendor} token="tok1" />);

  expect(screen.getByText(/1,200/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /רכישת מסלול פרו — תשלום מאובטח/ })
  ).toBeInTheDocument();
  // מובהר שפרטי הכרטיס לא עוברים דרכנו
  expect(screen.getByText(/אינם עוברים דרך VaddyGo/)).toBeInTheDocument();
});

test("לחיצה מעבירה לעמוד התשלום שהשרת החזיר", async () => {
  startVendorProCheckout.mockResolvedValue("https://pay.test/abc");
  render(<SupplierUpgrade vendor={vendor} token="tok1" />);

  userEvent.click(screen.getByRole("button", { name: /רכישת מסלול פרו — תשלום מאובטח/ }));

  await waitFor(() =>
    expect(startVendorProCheckout).toHaveBeenCalledWith("tok1")
  );
  await waitFor(() => expect(window.location.href).toBe("https://pay.test/abc"));
});

test("כשל בפתיחת התשלום מוצג ולא מפיל את המסך", async () => {
  startVendorProCheckout.mockRejectedValue(new Error("השרת אינו זמין"));
  render(<SupplierUpgrade vendor={vendor} token="tok1" />);

  userEvent.click(screen.getByRole("button", { name: /רכישת מסלול פרו — תשלום מאובטח/ }));

  expect(await screen.findByText("השרת אינו זמין")).toBeInTheDocument();
  expect(window.location.href).toBe("");
});

/*
  הבדיקה החשובה כרגע: כל עוד לא מחוברת סליקה (החלטת בעלת המוצר — ₪500 לחודש
  לא מוצדקים לפני שיש ספקים משלמים), אסור שספק יראה "תשלום מאובטח" ויגיע
  לעמוד שאינו גובה. במצב הזה חוזרים לפתיחה בתיאום אישי.
*/
test("בלי סליקה מחוברת אין כפתור תשלום — רק פנייה בוואטסאפ", () => {
  render(
    <SupplierUpgrade
      vendor={{ ...vendor, proCheckoutAvailable: false }}
      token="tok1"
    />
  );

  // הרכישה עדיין מוצגת — אבל מושלמת מולנו ולא בעמוד תשלום שאינו גובה
  expect(
    screen.queryByRole("button", { name: /תשלום מאובטח/ })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "רכישת מסלול פרו" })
  ).toBeInTheDocument();
  expect(screen.getByText(/ואנחנו פותחים לך את המסלול/)).toBeInTheDocument();
  expect(screen.getByText(/1,200/)).toBeInTheDocument();
});

test("ספק שכבר פרו רואה אישור ולא כפתור תשלום", () => {
  render(<SupplierUpgrade vendor={{ ...vendor, isPro: true }} token="tok1" />);

  expect(screen.getByText(/מסלול פרו נרכש בהצלחה/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /רכישת מסלול פרו — תשלום מאובטח/ })
  ).not.toBeInTheDocument();
});
