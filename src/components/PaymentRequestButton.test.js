import { render, screen, fireEvent } from "@testing-library/react";
import PaymentRequestButton from "./PaymentRequestButton";

const student = {
  id: 5,
  firstName: "דנה",
  lastName: "כהן",
  parentPhoneNumber: "050-1234567",
};

afterEach(() => {
  localStorage.clear();
  delete global.fetch;
});

function mockPayments(payments) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(payments) })
  );
}

test("פותח חלון בקשת תשלום, מציג חוב פתוח וקישור וואטסאפ להורה", async () => {
  mockPayments([
    { collectionCategoryId: 1, categoryName: "הזנה", amount: 1200, isPaid: false },
    { collectionCategoryId: 2, categoryName: "ועד", amount: 500, isPaid: true },
  ]);
  render(<PaymentRequestButton student={student} />);

  fireEvent.click(screen.getByRole("button", { name: /בקשת תשלום/ }));
  expect(await screen.findByText(/חוב פתוח/)).toBeInTheDocument();

  // מזומן זמין תמיד — קישור wa.me להורה (052... → 9725...)
  const cash = screen.getByRole("link", { name: /מזומן/ });
  expect(cash.getAttribute("href")).toContain("wa.me/972501234567");
  expect(cash.getAttribute("href")).toContain("text=");
});

test("כשכל התשלומים שולמו — מוצגת הודעה שאין חוב", async () => {
  mockPayments([
    { collectionCategoryId: 1, categoryName: "הזנה", amount: 1200, isPaid: true },
  ]);
  render(<PaymentRequestButton student={student} />);

  fireEvent.click(screen.getByRole("button", { name: /בקשת תשלום/ }));
  expect(await screen.findByText(/כל התשלומים של דנה כהן שולמו/)).toBeInTheDocument();
});

test("עם קישור ביט שמור — כפתור ביט מצרף את הקישור להודעה", async () => {
  localStorage.setItem(
    "vaadygo.paymentLinks",
    JSON.stringify({ bit: "https://bit.example/vaad", paybox: "" })
  );
  mockPayments([
    { collectionCategoryId: 1, categoryName: "הזנה", amount: 1200, isPaid: false },
  ]);
  render(<PaymentRequestButton student={student} />);

  fireEvent.click(screen.getByRole("button", { name: /בקשת תשלום/ }));
  const bit = await screen.findByRole("link", { name: "BIT" });
  expect(bit.getAttribute("href")).toContain(
    encodeURIComponent("https://bit.example/vaad")
  );
});
