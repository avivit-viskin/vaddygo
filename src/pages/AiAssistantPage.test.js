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
  fireEvent.click(screen.getByRole("button", { name: "שליחה" }));

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
  fireEvent.click(screen.getByRole("button", { name: "שליחה" }));

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
  fireEvent.click(screen.getByRole("button", { name: "שליחה" }));

  await screen.findByText(/הודעה חמה להורים/);
  const share = screen.getByRole("link", { name: /שיתוף בוואטסאפ/ });
  expect(share.getAttribute("href")).toContain("wa.me/?text=");
  expect(share.getAttribute("href")).toContain(
    encodeURIComponent("הודעה חמה להורים 💜")
  );
});

test("אפשר להגיב ולהמשיך את השיחה — התגובה נשלחת עם ההקשר הקודם", async () => {
  const calls = [];
  global.fetch = jest.fn((url, options) => {
    calls.push(JSON.parse(options.body));
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ answer: `תשובה ${calls.length}` }),
    });
  });
  renderPage();

  fireEvent.change(screen.getByLabelText("השאלה שלך"), {
    target: { value: "רעיון למתנה" },
  });
  fireEvent.click(screen.getByRole("button", { name: "שליחה" }));
  await screen.findByText("תשובה 1");

  // אחרי תשובה יש אפשרות להגיב — התווית הופכת ל"התגובה שלך"
  fireEvent.change(screen.getByLabelText("התגובה שלך"), {
    target: { value: "תודה, אפשר יותר זול?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "שליחה" }));
  await screen.findByText("תשובה 2");

  // התגובה השנייה נשלחה עם השיחה עד כה כרקע
  expect(calls[0].context).toBe("");
  expect(calls[1].context).toContain("רעיון למתנה");
  expect(calls[1].context).toContain("תשובה 1");
  // כל ההודעות מוצגות בשרשור
  expect(screen.getByText("רעיון למתנה")).toBeInTheDocument();
  expect(screen.getByText("תודה, אפשר יותר זול?")).toBeInTheDocument();
});
