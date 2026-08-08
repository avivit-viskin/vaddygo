import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PublicPollPage from "./PublicPollPage";
import { getPublicPoll, votePublicPoll } from "../services/pollsService";

jest.mock("../services/pollsService", () => ({
  getPublicPoll: jest.fn(),
  votePublicPoll: jest.fn(),
}));

const poll = {
  question: "איזו מתנה לגננת?",
  isClosed: false,
  totalVotes: 4,
  options: [
    { id: 1, text: "פרחים", votes: 3 },
    { id: 2, text: "שובר", votes: 1 },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/poll/abc123"]}>
      <Routes>
        <Route path="/poll/:token" element={<PublicPollPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  getPublicPoll.mockResolvedValue(poll);
  votePublicPoll.mockResolvedValue({ ...poll, totalVotes: 5 });
});

test("הורה רואה את השאלה ובוחר אפשרות — לפני ההצבעה אין תוצאות", async () => {
  renderPage();

  expect(await screen.findByText("איזו מתנה לגננת?")).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "פרחים" })).toBeInTheDocument();
  // התוצאות מוסתרות עד ההצבעה, כדי לא להטות את הבחירה
  expect(screen.queryByText(/3 ·/)).not.toBeInTheDocument();
});

test("שליחת תשובה נספרת ומוצגת תודה עם התוצאות", async () => {
  renderPage();
  await screen.findByText("איזו מתנה לגננת?");

  userEvent.click(screen.getByRole("radio", { name: "שובר" }));
  userEvent.click(screen.getByRole("button", { name: "שליחת התשובה" }));

  await waitFor(() =>
    expect(votePublicPoll).toHaveBeenCalledWith("abc123", 2)
  );
  expect(await screen.findByText(/התשובה נקלטה/)).toBeInTheDocument();
});

test("שליחה בלי בחירה מבקשת לבחור, ולא פונה לשרת", async () => {
  renderPage();
  await screen.findByText("איזו מתנה לגננת?");

  userEvent.click(screen.getByRole("button", { name: "שליחת התשובה" }));

  expect(await screen.findByText("צריך לבחור אפשרות")).toBeInTheDocument();
  expect(votePublicPoll).not.toHaveBeenCalled();
});

test("סקר סגור מציג את התוצאות בלי אפשרות להצביע", async () => {
  getPublicPoll.mockResolvedValue({ ...poll, isClosed: true });
  renderPage();

  expect(await screen.findByText(/הסקר נסגר לתשובות/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "שליחת התשובה" })
  ).not.toBeInTheDocument();
  expect(screen.getByText(/3 ·/)).toBeInTheDocument();
});

test("מי שכבר הצביע רואה את ההודעה ואת התוצאות, בלי קריסה", async () => {
  votePublicPoll.mockRejectedValue(new Error("כבר הצבעתם בסקר הזה 🙂"));
  renderPage();
  await screen.findByText("איזו מתנה לגננת?");

  userEvent.click(screen.getByRole("radio", { name: "פרחים" }));
  userEvent.click(screen.getByRole("button", { name: "שליחת התשובה" }));

  expect(await screen.findByText(/כבר הצבעתם בסקר הזה/)).toBeInTheDocument();
  expect(screen.getByText(/3 ·/)).toBeInTheDocument();
});
