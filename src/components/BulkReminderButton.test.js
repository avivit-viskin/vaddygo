import { render, screen, fireEvent } from "@testing-library/react";
import BulkReminderButton from "./BulkReminderButton";

const unpaid = [
  { id: 1, firstName: "דנה", lastName: "כהן", parentPhoneNumber: "050-1234567" },
  { id: 2, firstName: "יעל", lastName: "לוי", parentPhoneNumber: "052-7654321" },
];

test("פותח רשימת חייבים עם קישור וואטסאפ אישי לכל הורה + הודעת ברירת מחדל", () => {
  render(<BulkReminderButton unpaidStudents={unpaid} />);
  fireEvent.click(screen.getByRole("button", { name: /תזכורת לחייבים/ }));

  // ההודעה הגנרית מופיעה וניתנת לעריכה
  const textarea = screen.getByLabelText(/ההודעה שתישלח/);
  expect(textarea.value).toContain("מעבר על התשלומים לגן");

  // קישור וואטסאפ אישי לכל הורה (0 מוביל → 972)
  const links = screen.getAllByRole("link", { name: /שליחה/ });
  expect(links).toHaveLength(2);
  expect(links[0].getAttribute("href")).toContain("wa.me/972501234567");
  expect(links[1].getAttribute("href")).toContain("wa.me/972527654321");
});

test("עריכת ההודעה משתקפת בקישורי הוואטסאפ", () => {
  render(<BulkReminderButton unpaidStudents={unpaid} />);
  fireEvent.click(screen.getByRole("button", { name: /תזכורת לחייבים/ }));

  fireEvent.change(screen.getByLabelText(/ההודעה שתישלח/), {
    target: { value: "תזכורת קצרה" },
  });
  const link = screen.getAllByRole("link", { name: /שליחה/ })[0];
  expect(link.getAttribute("href")).toContain(encodeURIComponent("תזכורת קצרה"));
});

test("לחיצה על 'שליחה' מסמנת את ההורה כנשלח ומעדכנת את המונה", () => {
  render(<BulkReminderButton unpaidStudents={unpaid} />);
  fireEvent.click(screen.getByRole("button", { name: /תזכורת לחייבים/ }));

  expect(screen.getByText(/נשלחו/).textContent).toContain("0");
  fireEvent.click(screen.getAllByRole("link", { name: /שליחה/ })[0]);

  // המונה עלה, והכפתור הראשון הפך ל"שליחה חוזרת"
  expect(screen.getByText(/נשלחו/).textContent).toContain("1");
  expect(screen.getByRole("link", { name: /שליחה חוזרת/ })).toBeInTheDocument();
});

test("כשאין חייבים — מוצגת הודעה שכולם שילמו", () => {
  render(<BulkReminderButton unpaidStudents={[]} />);
  fireEvent.click(screen.getByRole("button", { name: /תזכורת לחייבים/ }));
  expect(screen.getByText(/כל ההורים שילמו/)).toBeInTheDocument();
});
