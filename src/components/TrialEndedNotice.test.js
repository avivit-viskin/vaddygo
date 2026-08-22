import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TrialEndedNotice, { shouldShowTrialEnded } from "./TrialEndedNotice";

const YESTERDAY = new Date(Date.now() - 86400000).toISOString();
const NEXT_WEEK = new Date(Date.now() + 7 * 86400000).toISOString();

function setActive(institution) {
  localStorage.setItem("vaadygo.institutions", JSON.stringify([institution]));
  localStorage.setItem("vaadygo.activeInstitution", institution.id);
}

function renderNotice() {
  return render(
    <MemoryRouter>
      <TrialEndedNotice />
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

/*
  מודל התמחור: חודש פרו מלא, ואז מעבר למסלול החינמי — בלי חסימה ובלי מחיקה.
  הבדיקות מכסות את שלושת המצבים שבהם קל לטעות.
*/
describe("מתי ההודעה מוצגת", () => {
  test("בתוך תקופת הניסיון — לא מציגים כלום", () => {
    expect(
      shouldShowTrialEnded({ isPro: true, isTrial: true, trialEndsAt: NEXT_WEEK })
    ).toBe(false);
  });

  test("אחרי שהניסיון נגמר ולא נרכש — מציגים", () => {
    expect(
      shouldShowTrialEnded({ isPro: false, isTrial: false, trialEndsAt: YESTERDAY })
    ).toBe(true);
  });

  test("מנוי בתשלום — לא מציגים, גם אם הניסיון מזמן נגמר", () => {
    expect(
      shouldShowTrialEnded({ isPro: true, isTrial: false, trialEndsAt: YESTERDAY })
    ).toBe(false);
  });
});

test("ההודעה אומרת קודם כול שהנתונים נשמרו", () => {
  setActive({ id: "a", name: "גן הרימון", isPro: false, isTrial: false, trialEndsAt: YESTERDAY });
  renderNotice();

  // זה החשש הראשון של מי שרואה "הניסיון הסתיים"
  expect(screen.getByText(/כל מה שיצרת נשמר/)).toBeInTheDocument();
  // מנוסח כ"המעבר לא מוחק" ולא כהבטחה מוחלטת — ב-30.8 יש מחיקה שנתית לכולם
  expect(screen.getByText(/המעבר למסלול החינמי לא מוחק כלום/)).toBeInTheDocument();
});

test("מוצעות שתי הדרכים: חידוש ב-149 והמשך חינם", () => {
  setActive({ id: "a", name: "גן הרימון", isPro: false, isTrial: false, trialEndsAt: YESTERDAY });
  renderNotice();

  expect(screen.getByText(/₪149 לשנה/)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "להמשיך במסלול החינמי" })
  ).toBeInTheDocument();
});

test("בחירה במסלול החינמי סוגרת את ההודעה ונזכרת", async () => {
  setActive({ id: "a", name: "גן הרימון", isPro: false, isTrial: false, trialEndsAt: YESTERDAY });
  const { unmount } = renderNotice();

  await userEvent.click(
    screen.getByRole("button", { name: "להמשיך במסלול החינמי" })
  );
  expect(screen.queryByText(/תקופת הניסיון של הפרו הסתיימה/)).toBeNull();

  // לא חוזרת אחרי רענון — ההחלטה כבר התקבלה
  unmount();
  renderNotice();
  expect(screen.queryByText(/תקופת הניסיון של הפרו הסתיימה/)).toBeNull();
});

/*
  הסגירה נשמרת לפי מוסד: החלטה על גן אחד אינה משתיקה את ההודעה בגן אחר.
*/
test("סגירה בגן אחד אינה משתיקה את ההודעה בגן אחר", async () => {
  localStorage.setItem(
    "vaadygo.institutions",
    JSON.stringify([
      { id: "a", serverGroupId: 1, name: "גן א", isPro: false, isTrial: false, trialEndsAt: YESTERDAY },
      { id: "b", serverGroupId: 2, name: "גן ב", isPro: false, isTrial: false, trialEndsAt: YESTERDAY },
    ])
  );
  localStorage.setItem("vaadygo.activeInstitution", "a");

  const first = renderNotice();
  await userEvent.click(
    screen.getByRole("button", { name: "להמשיך במסלול החינמי" })
  );
  first.unmount();

  localStorage.setItem("vaadygo.activeInstitution", "b");
  renderNotice();
  expect(screen.getByText(/תקופת הניסיון של הפרו הסתיימה/)).toBeInTheDocument();
});
