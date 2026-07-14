import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AiAssistantPage from "./AiAssistantPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <AiAssistantPage />
    </MemoryRouter>
  );
}

afterEach(() => {
  delete global.fetch;
});

test("מציג את הפתיח ואת שאלות המהירות", () => {
  renderPage();
  expect(screen.getByText(/במה ברצונך לעזור/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /תעזור לי לנסח הודעה להורים על תזכורת תשלום/ })
  ).toBeInTheDocument();
});

test("שליחת שאלה מציגה את תשובת העוזרת", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ answer: "שלום הורים יקרים, תזכורת קטנה..." }),
    })
  );
  renderPage();

  fireEvent.change(screen.getByLabelText("השאלה שלך"), {
    target: { value: "נסחי תזכורת" },
  });
  fireEvent.click(screen.getByRole("button", { name: "שליחה לעוזרת" }));

  expect(await screen.findByText(/שלום הורים יקרים/)).toBeInTheDocument();
});

test("כשהעוזרת לא מופעלת בשרת — מוצגת הודעה ידידותית", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status: 503,
      json: () =>
        Promise.resolve({ message: "עוזרת ה-AI עדיין לא הופעלה." }),
    })
  );
  renderPage();

  fireEvent.change(screen.getByLabelText("השאלה שלך"), {
    target: { value: "שאלה כלשהי" },
  });
  fireEvent.click(screen.getByRole("button", { name: "שליחה לעוזרת" }));

  expect(await screen.findByText(/עדיין לא הופעלה/)).toBeInTheDocument();
});

test("אחרי תשובה מופיע כפתור שיתוף לוואטסאפ עם תוכן התשובה", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ answer: "הודעה חמה להורים 💜" }),
    })
  );
  renderPage();

  fireEvent.change(screen.getByLabelText("השאלה שלך"), {
    target: { value: "נסחי הודעה" },
  });
  fireEvent.click(screen.getByRole("button", { name: "שליחה לעוזרת" }));

  await screen.findByText(/הודעה חמה להורים/);
  const share = screen.getByRole("link", { name: /שתפי בוואטסאפ/ });
  expect(share.getAttribute("href")).toContain("wa.me/?text=");
  expect(share.getAttribute("href")).toContain(
    encodeURIComponent("הודעה חמה להורים 💜")
  );
});
