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

  // שליחה כללית לקבוצה — קישור נפרד, בלי בחירת תלמיד
  const groupLink = screen.getByRole("link", { name: /שליחה לקבוצה/ });
  expect(groupLink.getAttribute("href")).toContain("wa.me/?text=");

  // שליחה אישית לכל הורה — 2 קישורים לפי מספר טלפון (052... → 9725...)
  const perParent = screen
    .getAllByRole("link", { name: /^שליחה/ })
    .filter((a) => /wa\.me\/972/.test(a.getAttribute("href") || ""));
  expect(perParent).toHaveLength(2);
  expect(perParent[0].getAttribute("href")).toContain("wa.me/972501234567");

  // כלי רשימת התפוצה — העתקת המספרים ואת ההודעה
  expect(
    screen.getByRole("button", { name: /העתקת המספרים/ })
  ).toBeInTheDocument();
  // "העתקת ההודעה" מופיע גם בכרטיס השליחה-לקבוצה הכללי וגם בכלי רשימת התפוצה
  expect(
    screen.getAllByRole("button", { name: /העתקת ההודעה/ }).length
  ).toBeGreaterThan(0);
});

test("כשלא בוחרים אף תלמיד — אין כלי שליחה", async () => {
  render(<BulkPaymentRequestButton students={students} />);
  fireEvent.click(
    screen.getByRole("button", { name: /בקשת תשלום בוואטסאפ/ })
  );
  await screen.findByLabelText("בחר הכל");

  expect(screen.queryByRole("button", { name: /העתקת המספרים/ })).toBeNull();
});
