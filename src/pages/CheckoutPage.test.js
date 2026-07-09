import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CheckoutPage from "./CheckoutPage";

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
