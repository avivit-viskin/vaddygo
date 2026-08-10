import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "./CheckoutPage";
import { isPro } from "../services/plan";

/*
  טסטים למסך התשלום (דמו): הצגת סכום מהכתובת, ולידציה, ומעבר למסך הצלחה.
  אין רשת אמיתית — התשלום מדומה בצד הלקוח בלבד.
*/
function renderAt(path) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <CheckoutPage />
    </MemoryRouter>
  );
}

afterEach(() => localStorage.clear());

test("מציג פס הדגמה, סכום ותיאור מהכתובת, וטופס כרטיס", () => {
  renderAt("/pay?amount=750&for=חוגים");
  expect(screen.getByText(/מסך הדגמה/)).toBeInTheDocument();
  expect(screen.getByText("חוגים")).toBeInTheDocument();
  expect(screen.getByText("750 ₪")).toBeInTheDocument();
  expect(screen.getByLabelText("מספר כרטיס")).toBeInTheDocument();
});

test("פרטים חסרים מציגים שגיאות ולא עוברים לתשלום", () => {
  renderAt("/pay");
  fireEvent.click(screen.getByRole("button", { name: /שלם/ }));
  expect(screen.getByText(/יש להזין את שם/)).toBeInTheDocument();
  expect(screen.getByText(/מספר כרטיס לא תקין/)).toBeInTheDocument();
});

test("תשלום עם פרטים תקינים מציג מסך הצלחה (הדגמה, בלי חיוב)", async () => {
  renderAt("/pay?amount=500");
  fireEvent.change(screen.getByLabelText("שם בעל/ת הכרטיס"), {
    target: { value: "דנה כהן" },
  });
  fireEvent.change(screen.getByLabelText("מספר כרטיס"), {
    target: { value: "4580123412341234" },
  });
  fireEvent.change(screen.getByLabelText("תוקף"), { target: { value: "05/28" } });
  fireEvent.change(screen.getByLabelText("CVV"), { target: { value: "123" } });
  fireEvent.click(screen.getByRole("button", { name: /שלם/ }));

  expect(
    await screen.findByText(/התשלום התקבל בהצלחה/, {}, { timeout: 2500 })
  ).toBeInTheDocument();
  expect(screen.getByText(/לא בוצע חיוב אמיתי/)).toBeInTheDocument();
});

test("קוד 1234 פותח מצב PRO — למנהלת VaddyGo", async () => {
  localStorage.setItem(
    "vaadygo.user",
    JSON.stringify({ username: "avivit", plan: "free", role: "SuperAdmin" })
  );
  renderAt("/pay?pro=1");

  fireEvent.change(screen.getByLabelText("מספר כרטיס"), {
    target: { value: "1234" },
  });
  fireEvent.click(screen.getByRole("button", { name: /שלם/ }));

  expect(await screen.findByText(/מצב PRO נפתח/)).toBeInTheDocument();
  // פרו נפתח לגן הפעיל (אין מוסד פעיל בטסט → נפתח לגן "default")
  expect(isPro()).toBe(true);
});

/*
  הבדיקה החשובה מבחינה עסקית: קוד הפתיחה נמצא בקובץ ה-JavaScript הציבורי של
  האתר, ולכן כל לקוחה יכולה למצוא אותו. אצל מי שאינה מנהלת הוא חייב להתנהג
  כמספר כרטיס לא תקין — אחרת ערוץ ההכנסה של VaddyGo נסגר בשקט.
*/
test("אצל לקוחה רגילה קוד 1234 אינו פותח PRO אלא נדחה כמספר כרטיס", async () => {
  localStorage.setItem(
    "vaadygo.user",
    JSON.stringify({ username: "committee", plan: "free", role: "Member" })
  );
  renderAt("/pay?pro=1");

  fireEvent.change(screen.getByLabelText("מספר כרטיס"), {
    target: { value: "1234" },
  });
  fireEvent.click(screen.getByRole("button", { name: /שלם/ }));

  expect(screen.getByText(/מספר כרטיס לא תקין/)).toBeInTheDocument();
  expect(screen.queryByText(/מצב PRO נפתח/)).not.toBeInTheDocument();
  expect(isPro()).toBe(false);
});
