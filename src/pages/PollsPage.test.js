import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PollsPage from "./PollsPage";
import { api } from "../services/api";

jest.mock("../services/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    del: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  api.get.mockResolvedValue([]);
});

function renderPage() {
  return render(
    <MemoryRouter>
      <PollsPage />
    </MemoryRouter>
  );
}

async function fillForm() {
  fireEvent.change(screen.getByLabelText("שאלת הסקר"), {
    target: { value: "איזו מתנה לגננת?" },
  });
  fireEvent.change(screen.getByLabelText("אפשרות 1"), {
    target: { value: "פרחים" },
  });
  fireEvent.change(screen.getByLabelText("אפשרות 2"), {
    target: { value: "שובר" },
  });
  userEvent.click(screen.getByRole("button", { name: "יצירת סקר" }));
}

test("סקר שנשמר בשרת מוצג עם התוצאות ועם קישור להורים", async () => {
  const created = {
    id: 5,
    question: "איזו מתנה לגננת?",
    publicToken: "tok5",
    isClosed: false,
    totalVotes: 3,
    options: [
      { id: 1, text: "פרחים", votes: 2 },
      { id: 2, text: "שובר", votes: 1 },
    ],
  };
  api.post.mockResolvedValue(created);

  renderPage();
  await waitFor(() => expect(api.get).toHaveBeenCalled());

  // אחרי היצירה הרשימה נטענת מחדש מהשרת — עם הספירה האמיתית
  api.get.mockResolvedValue([created]);
  await fillForm();

  expect(await screen.findByText("איזו מתנה לגננת?")).toBeInTheDocument();
  expect(screen.getByText("פרחים")).toBeInTheDocument();
  expect(screen.getByText(/סה״כ 3 קולות/)).toBeInTheDocument();

  // בסקר שרת אין ספירה ידנית — ההורים סופרים בעצמם דרך הקישור
  expect(
    screen.queryByRole("button", { name: /הוספת קול/ })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /העתקת הקישור/ })
  ).toBeInTheDocument();
  expect(screen.getByText(/מתעדכנות לבד/)).toBeInTheDocument();
});

test("בלי שרת הסקר נשמר מקומית ונשארת ספירה ידנית", async () => {
  api.post.mockRejectedValue(new Error("אין שרת"));

  renderPage();
  await waitFor(() => expect(api.get).toHaveBeenCalled());
  await fillForm();

  expect(await screen.findByText("איזו מתנה לגננת?")).toBeInTheDocument();
  expect(screen.getByText(/נשמר במכשיר בלבד/)).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: /הוספת קול לפרחים/ }));
  expect(await screen.findByText(/סה״כ 1 קולות/)).toBeInTheDocument();
});
