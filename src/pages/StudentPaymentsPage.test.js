import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import StudentPaymentsPage from "./StudentPaymentsPage";

/*
  טסטים למסך תשלומי תלמיד (שלב 5): שורה לכל קטגוריה, סימון ששולם,
  ולידציה של אמצעי תשלום, וכפתור תזכורת וואטסאפ.
  קריאות השרת מדומות דרך global.fetch.
*/

const student = {
  id: 1,
  firstName: "הילי",
  lastName: "לוי",
  className: "בוגרים",
  parentPhoneNumber: "0501112223",
};

function jsonResponse(data, status = 200) {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
  });
}

/* מדמה שרת: מחזיר את התלמיד ואת התשלומים, ומעדכן בעת PUT. */
function mockServer() {
  let payments = [
    {
      id: 0,
      studentId: 1,
      collectionCategoryId: 1,
      categoryName: "הזנה",
      amount: 1200,
      bitAmount: 0,
      payBoxAmount: 0,
      cashAmount: 0,
      isPaid: false,
      paidDate: null,
    },
    {
      id: 5,
      studentId: 1,
      collectionCategoryId: 2,
      categoryName: "דמי ועד",
      amount: 500,
      bitAmount: 0,
      payBoxAmount: 0,
      cashAmount: 500,
      isPaid: true,
      paidDate: "2026-07-09T00:00:00Z",
    },
  ];

  global.fetch = jest.fn((url, options = {}) => {
    const method = options.method ?? "GET";
    if (method === "PUT") {
      const categoryId = Number(url.split("/").pop());
      const body = JSON.parse(options.body);
      payments = payments.map((p) =>
        p.collectionCategoryId === categoryId
          ? { ...p, ...body, id: p.id || 10 }
          : p
      );
      return jsonResponse(payments.find((p) => p.collectionCategoryId === categoryId));
    }
    if (url.endsWith("/payments")) {
      return jsonResponse(payments);
    }
    return jsonResponse(student); // GET /api/students/1
  });
}

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={["/students/1/payments"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/students/:studentId/payments"
          element={<StudentPaymentsPage />}
        />
        <Route path="/students" element={<div>מסך התלמידים</div>} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  delete global.fetch;
});

test("מציג שורה לכל קטגוריה עם סיכום כמה שולמו", async () => {
  mockServer();
  renderPage();

  expect(await screen.findByText(/תשלומים — הילי לוי/)).toBeInTheDocument();
  expect(screen.getByText(/שולמו 1 מתוך 2 קטגוריות/)).toBeInTheDocument();
  expect(screen.getByText("הזנה")).toBeInTheDocument();
  expect(screen.getByText("דמי ועד")).toBeInTheDocument();
  // הקטגוריה ששולמה מציגה סטטוס עם פירוט האמצעים (מזומן 500)
  expect(screen.getByText(/שולם ✓ \(מזומן/)).toBeInTheDocument();
});

test("הזנת סכום באמצעי וסימון ששולם שולח PUT ומעדכן את הסטטוס", async () => {
  mockServer();
  renderPage();
  await screen.findByText(/תשלומים — הילי לוי/);

  // מזינים סכום בשדה "ביט" של הקטגוריה שטרם שולמה, ומסמנים ששולם
  await userEvent.type(screen.getByLabelText("ביט"), "300");
  await userEvent.click(screen.getByRole("button", { name: "סמן ששולם" }));

  expect(await screen.findByText(/שולם ✓ \(ביט/)).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/students/1/payments/1"),
    expect.objectContaining({ method: "PUT" })
  );
});

test("סימון ששולם בלי שום סכום מציג שגיאה ולא שולח לשרת", async () => {
  mockServer();
  renderPage();
  await screen.findByText(/תשלומים — הילי לוי/);

  await userEvent.click(screen.getByRole("button", { name: "סמן ששולם" }));

  expect(await screen.findByText(/יש להזין סכום/)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalledWith(
    expect.stringContaining("/payments/1"),
    expect.objectContaining({ method: "PUT" })
  );
});

test("כפתור תזכורת וואטסאפ מקשר למספר ההורה עם הודעה מוכנה", async () => {
  mockServer();
  renderPage();
  await screen.findByText(/תשלומים — הילי לוי/);

  const link = screen.getByRole("link", { name: /תזכורת בוואטסאפ/ });
  expect(link).toHaveAttribute(
    "href",
    expect.stringContaining("wa.me/972501112223")
  );
  expect(link.getAttribute("href")).toContain(encodeURIComponent("הזנה"));
});
