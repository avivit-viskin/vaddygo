import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CardReturnPage from "./CardReturnPage";

// מבודדים את קריאת ה-webhook (הסימולטור)
jest.mock("../services/cardPaymentService", () => ({
  confirmMockPayment: jest.fn(() => Promise.resolve()),
}));
import { confirmMockPayment } from "../services/cardPaymentService";

function renderAt(url) {
  return render(
    <MemoryRouter
      initialEntries={[url]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <CardReturnPage />
    </MemoryRouter>
  );
}

afterEach(() => jest.clearAllMocks());

test("סימולטור: 'אשר תשלום' שולח webhook ומציג הצלחה", async () => {
  renderAt("/pay/return?ref=abc123&amount=400&mock=1");
  expect(screen.getByText(/עמוד תשלום לדוגמה/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /אשר תשלום/ }));
  expect(confirmMockPayment).toHaveBeenCalledWith("abc123", 400);
  expect(await screen.findByText(/התשלום התקבל/)).toBeInTheDocument();
});

test("חזרה אמיתית (בלי mock) מציגה תודה ישר, בלי webhook", () => {
  renderAt("/pay/return?ref=abc123&amount=400");
  expect(screen.getByText(/התשלום התקבל/)).toBeInTheDocument();
  expect(confirmMockPayment).not.toHaveBeenCalled();
});
