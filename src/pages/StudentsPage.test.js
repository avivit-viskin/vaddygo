import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import StudentsPage from "./StudentsPage";

/*
  טסטים למסך התלמידים המלא (שלב 2): מונה, חיפוש, סינון,
  הוספה עם ולידציה, עריכה ומחיקה עם אישור.
  קריאות השרת מדומות דרך global.fetch — בלי שרת אמיתי.
  עטוף ב-MemoryRouter כי המסך משתמש בניווט לתשלומים (שלב 5).
*/

/* מרנדר את המסך בתוך Router (המסך מנווט למסך התשלומים) */
function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StudentsPage />
    </MemoryRouter>
  );
}

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

/*
  מדמה שרת קטן: GET מחזיר את הרשימה, GET .../payments מחזיר את תשלומי התלמיד
  (למונה התג ולסינון), ושאר הפעולות מעדכנות את הרשימה.
*/
function mockServer(initialStudents, paymentsByStudent = {}) {
  let students = [...initialStudents];
  global.fetch = jest.fn((url, options = {}) => {
    const method = options.method ?? "GET";
    if (method === "GET" && url.endsWith("/payments")) {
      const studentId = Number(url.split("/").slice(-2)[0]);
      return jsonResponse(paymentsByStudent[studentId] ?? []);
    }
    // רשימת הקבוצות/כיתות של המוסד — מזינה את מסנן הקבוצה
    if (method === "GET" && url.includes("/groups")) {
      return jsonResponse([{ id: 1, name: "כללי", subgroups: ["פרפרים", "חובה"] }]);
    }
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
  renderPage();

  expect(
    await screen.findByRole("heading", { name: /2 תלמידים/ })
  ).toBeInTheDocument();
  expect(screen.getByText(/דנה כהן/)).toBeInTheDocument();
  expect(screen.getByText(/נועם לוי/)).toBeInTheDocument();
});

test("סימון הכל מציג את כפתור בקשת התשלום הגורפת לנבחרים", async () => {
  mockServer([dana, noam]);
  renderPage();
  await screen.findByText(/דנה כהן/);

  await userEvent.click(screen.getByLabelText("סמן הכל"));

  expect(screen.getByText(/2 נבחרו/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /בקשת תשלום לנבחרים/ })
  ).toBeInTheDocument();
});

test("חיפוש חופשי מסנן את הכרטיסים ומציג הודעה כשאין תוצאות", async () => {
  mockServer([dana, noam]);
  renderPage();
  await screen.findByText(/דנה כהן/);

  await userEvent.type(screen.getByLabelText("חיפוש"), "נועם");
  expect(screen.queryByText(/דנה כהן/)).not.toBeInTheDocument();
  expect(screen.getByText(/נועם לוי/)).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText("חיפוש"), " אבגדה");
  expect(
    screen.getByText(/לא נמצאו תלמידים שמתאימים לחיפוש/)
  ).toBeInTheDocument();
});

test("מציג תג סטטוס תשלום ומסנן למי שטרם שילם", async () => {
  // קטגוריה נספרת כ"שולמה" רק כשסכום האמצעים מגיע ליעד — לא רק דגל isPaid.
  mockServer([dana, noam], {
    1: [
      { collectionCategoryId: 1, categoryName: "הזנה", amount: 1200, cashAmount: 1200, isPaid: true },
      { collectionCategoryId: 2, categoryName: "ועד", amount: 500, cashAmount: 500, isPaid: true },
    ],
    2: [
      { collectionCategoryId: 1, categoryName: "הזנה", amount: 1200, cashAmount: 0, isPaid: false },
      { collectionCategoryId: 2, categoryName: "ועד", amount: 500, cashAmount: 500, isPaid: true },
    ],
  });
  renderPage();

  // התגים נטענים ברקע אחרי הכרטיסים
  expect(await screen.findByText("שולם 2/2")).toBeInTheDocument(); // דנה שילמה הכל
  expect(screen.getByText("שולם 1/2")).toBeInTheDocument(); // נועם חלקי (שילם ועד, לא הזנה)

  // סינון "רק מי שטרם שילם" מסתיר את מי ששילמה הכל
  await userEvent.click(screen.getByLabelText("הצג רק מי שטרם שילם"));
  expect(screen.queryByText(/דנה כהן/)).not.toBeInTheDocument();
  expect(screen.getByText(/נועם לוי/)).toBeInTheDocument();
});

test("סינון לפי קבוצה מציג רק את תלמידי הקבוצה שנבחרה", async () => {
  mockServer([dana, noam]);
  renderPage();
  await screen.findByText(/דנה כהן/);

  // המסנן מופיע רק כשלמוסד יש קבוצות — מחכים שייטען מהשרת המדומה
  const filter = await screen.findByLabelText("סינון לפי קבוצה");
  await userEvent.selectOptions(filter, "חובה");
  expect(screen.queryByText(/דנה כהן/)).not.toBeInTheDocument();
  expect(screen.getByText(/נועם לוי/)).toBeInTheDocument();
});

test("טופס ההוספה מציג שגיאות ולידציה בעברית ליד השדות", async () => {
  mockServer([]);
  renderPage();
  await screen.findByText(/עדיין אין תלמידים/);

  await userEvent.click(screen.getByRole("button", { name: /הוספת תלמיד/ }));
  await userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(await screen.findByText("שם פרטי הוא שדה חובה")).toBeInTheDocument();
  expect(screen.getByText("שם משפחה הוא שדה חובה")).toBeInTheDocument();
  expect(screen.getByText("טלפון הורה הוא שדה חובה")).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText("טלפון הורה"), "123");
  await userEvent.click(screen.getByRole("button", { name: "שמירה" }));
  expect(
    await screen.findByText(/מספר הטלפון אינו תקין/)
  ).toBeInTheDocument();
});

test("הוספת תלמיד: שולח POST לשרת ומציג את התלמיד החדש", async () => {
  mockServer([]);
  renderPage();
  await screen.findByText(/עדיין אין תלמידים/);

  await userEvent.click(screen.getByRole("button", { name: /הוספת תלמיד/ }));
  await userEvent.type(screen.getByLabelText("שם פרטי"), "הילי");
  await userEvent.type(screen.getByLabelText("שם משפחה"), "לוי");
  await userEvent.type(screen.getByLabelText("טלפון הורה"), "050-1112223");
  // המוסד מחולק לקבוצות → שדה הקבוצה חובה
  await userEvent.selectOptions(await screen.findByLabelText("קבוצה"), "פרפרים");
  await userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(await screen.findByText(/הילי לוי/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/students"),
    expect.objectContaining({ method: "POST" })
  );
});

test("עריכת תלמיד: הטופס נפתח עם הנתונים הקיימים ושולח PUT", async () => {
  mockServer([dana]);
  renderPage();
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
  renderPage();
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
