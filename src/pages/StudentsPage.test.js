import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentsPage from "./StudentsPage";

/*
  טסטים למסך התלמידים המלא (שלב 2): מונה, חיפוש, סינון,
  הוספה עם ולידציה, עריכה ומחיקה עם אישור.
  קריאות השרת מדומות דרך global.fetch — בלי שרת אמיתי.
*/

const dana = {
  id: 1,
  firstName: "דנה",
  lastName: "כהן",
  className: "פרפרים",
  parentPhoneNumber: "0501234567",
};

const noam = {
  id: 2,
  firstName: "נועם",
  lastName: "לוי",
  className: "חובה",
  parentPhoneNumber: "0529876543",
};

function jsonResponse(data, status = 200) {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
  });
}

/* מדמה שרת קטן: GET מחזיר את הרשימה, ושאר הפעולות מעדכנות אותה. */
function mockServer(initialStudents) {
  let students = [...initialStudents];
  global.fetch = jest.fn((url, options = {}) => {
    const method = options.method ?? "GET";
    if (method === "POST") {
      const created = { id: 99, ...JSON.parse(options.body) };
      students = [...students, created];
      return jsonResponse(created, 201);
    }
    if (method === "PUT") {
      const id = Number(url.split("/").pop());
      const updated = { id, ...JSON.parse(options.body) };
      students = students.map((s) => (s.id === id ? updated : s));
      return jsonResponse(updated);
    }
    if (method === "DELETE") {
      const id = Number(url.split("/").pop());
      students = students.filter((s) => s.id !== id);
      return Promise.resolve({ ok: true, status: 204 });
    }
    return jsonResponse(students);
  });
}

afterEach(() => {
  delete global.fetch;
});

test("מציג מונה עם מספר התלמידים וכרטיס לכל תלמיד", async () => {
  mockServer([dana, noam]);
  render(<StudentsPage />);

  expect(
    await screen.findByRole("heading", { name: /2 תלמידים/ })
  ).toBeInTheDocument();
  expect(screen.getByText(/דנה כהן/)).toBeInTheDocument();
  expect(screen.getByText(/נועם לוי/)).toBeInTheDocument();
});

test("חיפוש חופשי מסנן את הכרטיסים ומציג הודעה כשאין תוצאות", async () => {
  mockServer([dana, noam]);
  render(<StudentsPage />);
  await screen.findByText(/דנה כהן/);

  await userEvent.type(screen.getByLabelText("חיפוש"), "נועם");
  expect(screen.queryByText(/דנה כהן/)).not.toBeInTheDocument();
  expect(screen.getByText(/נועם לוי/)).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText("חיפוש"), " אבגדה");
  expect(
    screen.getByText(/לא נמצאו תלמידים שמתאימים לחיפוש/)
  ).toBeInTheDocument();
});

test("סינון לפי כיתה מציג רק את תלמידי הכיתה שנבחרה", async () => {
  mockServer([dana, noam]);
  render(<StudentsPage />);
  await screen.findByText(/דנה כהן/);

  await userEvent.selectOptions(
    screen.getByLabelText("סינון לפי כיתה"),
    "חובה"
  );
  expect(screen.queryByText(/דנה כהן/)).not.toBeInTheDocument();
  expect(screen.getByText(/נועם לוי/)).toBeInTheDocument();
});

test("טופס ההוספה מציג שגיאות ולידציה בעברית ליד השדות", async () => {
  mockServer([]);
  render(<StudentsPage />);
  await screen.findByText(/עדיין אין תלמידים/);

  await userEvent.click(screen.getByRole("button", { name: /הוספת תלמיד/ }));
  await userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(await screen.findByText("שם פרטי הוא שדה חובה")).toBeInTheDocument();
  expect(screen.getByText("שם משפחה הוא שדה חובה")).toBeInTheDocument();
  expect(screen.getByText("כיתה/קבוצה היא שדה חובה")).toBeInTheDocument();
  expect(screen.getByText("טלפון הורה הוא שדה חובה")).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText("טלפון הורה"), "123");
  await userEvent.click(screen.getByRole("button", { name: "שמירה" }));
  expect(
    await screen.findByText(/מספר הטלפון אינו תקין/)
  ).toBeInTheDocument();
});

test("הוספת תלמיד: שולח POST לשרת ומציג את התלמיד החדש", async () => {
  mockServer([]);
  render(<StudentsPage />);
  await screen.findByText(/עדיין אין תלמידים/);

  await userEvent.click(screen.getByRole("button", { name: /הוספת תלמיד/ }));
  await userEvent.type(screen.getByLabelText("שם פרטי"), "הילי");
  await userEvent.type(screen.getByLabelText("שם משפחה"), "לוי");
  await userEvent.type(screen.getByLabelText("כיתה/קבוצה"), "בוגרים");
  await userEvent.type(screen.getByLabelText("טלפון הורה"), "050-1112223");
  await userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(await screen.findByText(/הילי לוי/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/students"),
    expect.objectContaining({ method: "POST" })
  );
});

test("עריכת תלמיד: הטופס נפתח עם הנתונים הקיימים ושולח PUT", async () => {
  mockServer([dana]);
  render(<StudentsPage />);
  await screen.findByText(/דנה כהן/);

  await userEvent.click(screen.getByRole("button", { name: "עריכה" }));
  const lastNameInput = screen.getByLabelText("שם משפחה");
  expect(lastNameInput).toHaveValue("כהן");

  await userEvent.clear(lastNameInput);
  await userEvent.type(lastNameInput, "לוינסון");
  await userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(await screen.findByText(/דנה לוינסון/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/students/1"),
    expect.objectContaining({ method: "PUT" })
  );
});

test("מחיקת תלמיד: דיאלוג אישור עם השם, ואחרי אישור נשלח DELETE", async () => {
  mockServer([dana]);
  render(<StudentsPage />);
  await screen.findByText(/דנה כהן/);

  await userEvent.click(screen.getByRole("button", { name: "מחיקה" }));
  expect(
    await screen.findByText(/למחוק את דנה כהן\? אי אפשר לבטל/)
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "כן, למחוק" }));
  expect(await screen.findByText(/עדיין אין תלמידים/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/students/1"),
    expect.objectContaining({ method: "DELETE" })
  );
});
