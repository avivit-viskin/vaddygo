import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import HomePage from "../HomePage";

/*
  טסטים למסך הבית (UI_SPEC ס' 8). בסביבת הטסטים אין שרת,
  ולכן נבדק מסלול ה-fallback: בניית הסיכום מנתוני האשף שב-localStorage.
*/

function seedOnboarding() {
  localStorage.setItem(
    "vaadygo.onboarding",
    JSON.stringify({
      ganName: "גן הפרחים",
      city: "תל אביב",
      childrenCount: "22",
      categories: [
        { key: "meals", name: "תשלום הזנה", amount: "1200", installments: 1 },
        { key: "committee", name: "דמי ועד", amount: "500", installments: 1 },
      ],
      completedAt: new Date().toISOString(),
    })
  );
}

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  // אין שרת בטסטים — כל קריאת רשת נכשלת מיד ונופלת לגיבוי המקומי (מהיר ויציב).
  global.fetch = jest.fn(() => Promise.reject(new Error("no network in tests")));
});

afterEach(() => {
  delete global.fetch;
});

test("מסך הבית מציג את שם הגן, יעד הגבייה, והתראה בפעמון", async () => {
  seedOnboarding();
  renderHome();

  expect(await screen.findByText(/גן הפרחים/)).toBeInTheDocument();
  // יעד הגבייה: (1,200 + 500) × 22 ילדים = 37,400
  expect(screen.getByText(/37,400/)).toBeInTheDocument();
  // פירוק לפי אמצעי תשלום
  expect(screen.getByText("ביט")).toBeInTheDocument();
  expect(screen.getByText("פייבוקס")).toBeInTheDocument();
  expect(screen.getByText("מזומן")).toBeInTheDocument();

  // ההתראה על התשלומים מופיעה בפאנל שנפתח מהפעמון
  userEvent.click(screen.getByRole("button", { name: /התראות/ }));
  expect(await screen.findByText(/22 ילדים טרם שילמו/)).toBeInTheDocument();
});

test("אפשר לסמן התראה כנקראה, והיא מסומנת ✓ נקרא", async () => {
  seedOnboarding();
  renderHome();
  await screen.findByText(/גן הפרחים/);

  userEvent.click(screen.getByRole("button", { name: /התראות/ }));
  const markBtn = await screen.findByRole("button", {
    name: /סמן כנקרא: .*22 ילדים/,
  });
  userEvent.click(markBtn);

  expect(await screen.findByText("✓ נקרא")).toBeInTheDocument();
});

test("מציג את יתרת הקופה ואת החוב הפתוח, עם כפתור עדכון יתרה", async () => {
  seedOnboarding();
  renderHome();
  await screen.findByText(/גן הפרחים/);

  expect(screen.getByText("יתרת הקופה")).toBeInTheDocument();
  expect(screen.getByText("חוב פתוח")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /עדכון יתרה/ })
  ).toBeInTheDocument();
});

test("הוספת אשת צוות נשמרת ומופיעה ברשימת ימי ההולדת", async () => {
  seedOnboarding();
  renderHome();
  await screen.findByText(/גן הפרחים/);

  userEvent.click(screen.getByRole("button", { name: "+ הוספת איש צוות" }));
  userEvent.type(screen.getByLabelText("שם מלא"), "רותי לוי");
  userEvent.type(screen.getByLabelText("תפקיד"), "גננת");
  fireEvent.change(screen.getByLabelText("תאריך לידה"), {
    target: { value: "1988-07-12" },
  });
  userEvent.click(screen.getByRole("button", { name: "שמירה" }));

  expect(await screen.findByText("רותי לוי")).toBeInTheDocument();
  expect(screen.getByText(/גננת/)).toBeInTheDocument();
});

test("בלי הגדרת גן מוצגת הזמנה להתחיל את האשף", async () => {
  renderHome();

  expect(
    await screen.findByText(/עוד לא הגדרנו את הגן/)
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "להגדרת הגן" })).toBeInTheDocument();
});
