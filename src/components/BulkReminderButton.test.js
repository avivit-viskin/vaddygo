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
  const links = screen.getAllByRole("link", { name: /^שליחה/ });
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
  const link = screen.getAllByRole("link", { name: /^שליחה/ })[0];
  expect(link.getAttribute("href")).toContain(encodeURIComponent("תזכורת קצרה"));
});

test("לחיצה על 'שליחה' מסמנת את ההורה כנשלח ומעדכנת את המונה", () => {
  render(<BulkReminderButton unpaidStudents={unpaid} />);
  fireEvent.click(screen.getByRole("button", { name: /תזכורת לחייבים/ }));

  expect(screen.getByText(/נשלחו/).textContent).toContain("0");
  fireEvent.click(screen.getAllByRole("link", { name: /^שליחה/ })[0]);

  // המונה עלה, והכפתור הראשון הפך ל"שליחה חוזרת"
  expect(screen.getByText(/נשלחו/).textContent).toContain("1");
  expect(screen.getByRole("link", { name: /שליחה חוזרת/ })).toBeInTheDocument();
});

test("סינון לפי כיתה מציג רק את הורי הכיתה שנבחרה", () => {
  const withClasses = [
    { id: 1, firstName: "דנה", lastName: "כהן", parentPhoneNumber: "050-1111111", className: "פרפרים" },
    { id: 2, firstName: "יעל", lastName: "לוי", parentPhoneNumber: "052-2222222", className: "דבורים" },
  ];
  render(<BulkReminderButton unpaidStudents={withClasses} />);
  fireEvent.click(screen.getByRole("button", { name: /תזכורת לחייבים/ }));

  expect(screen.getAllByRole("link", { name: /^שליחה/ })).toHaveLength(2);

  fireEvent.change(screen.getByLabelText(/סינון לפי כיתה/), {
    target: { value: "פרפרים" },
  });
  expect(screen.getAllByRole("link", { name: /^שליחה/ })).toHaveLength(1);
  expect(screen.getByText(/דנה כהן/)).toBeInTheDocument();
  expect(screen.queryByText(/יעל לוי/)).not.toBeInTheDocument();
});

test("כשאין חייבים אך יש תלמידים — מוצגת הודעה שכולם שילמו", () => {
  render(<BulkReminderButton unpaidStudents={[]} totalStudents={3} />);
  fireEvent.click(screen.getByRole("button", { name: /תזכורת לחייבים/ }));
  expect(screen.getByText(/כל ההורים שילמו/)).toBeInTheDocument();
});

test("כשאין תלמידים בכלל — מוצגת הודעה שאין עדיין תלמידים (לא 'כולם שילמו')", () => {
  render(<BulkReminderButton unpaidStudents={[]} totalStudents={0} />);
  fireEvent.click(screen.getByRole("button", { name: /תזכורת לחייבים/ }));
  expect(screen.getByText(/עדיין אין תלמידים ברשימה/)).toBeInTheDocument();
  expect(screen.queryByText(/כל ההורים שילמו/)).not.toBeInTheDocument();
});
