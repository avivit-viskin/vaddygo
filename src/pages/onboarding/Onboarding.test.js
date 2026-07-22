import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import WelcomePage from "../WelcomePage";
import OnboardingWizard from "./OnboardingWizard";
import { getOnboarding } from "../../services/onboardingService";

/*
  טסטים לשלב 3: מסך הפתיחה ואשף ההרשמה.
*/

function renderWithRouter(ui) {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {ui}
    </MemoryRouter>
  );
}

beforeEach(() => {
  // אין רשת אמיתית בטסטים — כל fetch נכשל מיד: השלמת הגנים מ-data.gov.il
  // וקריאות השרת נופלות חיננית ל-fallback המקומי. מונע flakiness מקריאה חיצונית איטית.
  global.fetch = jest.fn(() => Promise.reject(new TypeError("no network in tests")));
});

afterEach(() => {
  localStorage.clear();
  delete global.fetch;
});

test("מסך הפתיחה מציג לוגו ושני כפתורים", () => {
  renderWithRouter(<WelcomePage />);
  expect(screen.getByRole("button", { name: "שנתחיל?" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "כבר יש לי חשבון — כניסה" })
  ).toBeInTheDocument();
});

test("האשף לא ממשיך מצעד 1 בלי פרטי חובה", () => {
  renderWithRouter(<OnboardingWizard />);
  expect(screen.getByText("שאלה 1/4")).toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: "המשך" }));
  expect(screen.getByText("צריך למלא עיר")).toBeInTheDocument();
  expect(screen.getByText("שאלה 1/4")).toBeInTheDocument();
});

test("מסלול מלא באשף: מילוי, סיכום ושמירה", async () => {
  renderWithRouter(<OnboardingWizard />);

  userEvent.type(screen.getByLabelText("עיר / יישוב"), "תל אביב");
  userEvent.type(screen.getByLabelText("שם הגן / בית הספר"), "גן הפרחים");
  userEvent.type(screen.getByLabelText("מספר ילדים"), "22");
  userEvent.type(screen.getByLabelText("מספר אנשי צוות"), "2");
  userEvent.click(screen.getByRole("button", { name: "המשך" })); // → קבוצות

  userEvent.click(screen.getByRole("button", { name: "לא" })); // בלי חלוקה
  userEvent.click(screen.getByRole("button", { name: "המשך" })); // → גבייה

  userEvent.type(
    screen.getByLabelText(/סכום לתלמיד לשנה/, { selector: "#ob-amount-meals" }),
    "1200"
  );
  expect(screen.getByText(/סה"כ לתלמיד: 1,200 ₪/)).toBeInTheDocument();
  expect(
    screen.getByText(/יעד גבייה כולל ל-22 תלמידים: 26,400 ₪/)
  ).toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: "המשך" })); // → סיכום

  expect(
    screen.getByText(/הכל מוכן! גן הפרחים הוגדר בהצלחה/)
  ).toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: "כניסה לאפליקציה" }));

  // השמירה אסינכרונית (מנסה שרת ונופלת לגיבוי מקומי) — מחכים שתסתיים
  await waitFor(() => {
    const saved = getOnboarding();
    expect(saved).not.toBeNull();
    expect(saved.ganName).toBe("גן הפרחים");
    expect(saved.city).toBe("תל אביב");
  });
});
