import { render, screen, fireEvent } from "@testing-library/react";
import BulkPaymentRequestButton from "./BulkPaymentRequestButton";

const students = [
  { id: 1, firstName: "דנה", lastName: "כהן", parentPhoneNumber: "050-1234567" },
  { id: 2, firstName: "נועם", lastName: "לוי", parentPhoneNumber: "052-7654321" },
];

afterEach(() => localStorage.clear());

test("פותחים את החלון, מסמנים תלמידים, ומקבלים שליחה אישית + העתקת מספרים לרשימת תפוצה", async () => {
  render(<BulkPaymentRequestButton students={students} />);

  fireEvent.click(
    screen.getByRole("button", { name: /בקשת תשלום בוואטסאפ/ })
  );

  // סימון כל התלמידים בתוך החלון
  fireEvent.click(await screen.findByLabelText("בחר הכל"));

  // שליחה אישית לכל הורה (052... → 9725...)
  const sendLinks = screen.getAllByRole("link", { name: /^שליחה/ });
  expect(sendLinks).toHaveLength(2);
  expect(sendLinks[0].getAttribute("href")).toContain("wa.me/972501234567");

  // כלי רשימת התפוצה — העתקת המספרים ואת ההודעה
  expect(
    screen.getByRole("button", { name: /העתקת המספרים/ })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /העתקת ההודעה/ })
  ).toBeInTheDocument();
});

test("כשלא בוחרים אף תלמיד — אין כלי שליחה", async () => {
  render(<BulkPaymentRequestButton students={students} />);
  fireEvent.click(
    screen.getByRole("button", { name: /בקשת תשלום בוואטסאפ/ })
  );
  await screen.findByLabelText("בחר הכל");

  expect(screen.queryByRole("button", { name: /העתקת המספרים/ })).toBeNull();
});
