import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TrialActiveBanner, {
  shouldShowTrialActive,
  daysLeft,
} from "./TrialActiveBanner";

const IN_5_DAYS = new Date(Date.now() + 5 * 86400000).toISOString();

function setActive(institution) {
  localStorage.setItem("vaadygo.institutions", JSON.stringify([institution]));
  localStorage.setItem("vaadygo.activeInstitution", institution.id);
}

function renderBanner() {
  return render(
    <MemoryRouter>
      <TrialActiveBanner />
    </MemoryRouter>
  );
}

beforeEach(() => localStorage.clear());

describe("מתי הבאנר מוצג", () => {
  test("פרו פתוח ללא עלות — מציגים", () => {
    expect(
      shouldShowTrialActive({ isPro: true, isTrial: true, trialEndsAt: IN_5_DAYS })
    ).toBe(true);
  });

  /* מנוי בתשלום אינו "ללא עלות" — הבאנר היה מטעה. */
  test("מנוי בתשלום — לא מציגים", () => {
    expect(
      shouldShowTrialActive({ isPro: true, isTrial: false, trialEndsAt: IN_5_DAYS })
    ).toBe(false);
  });

  test("מסלול חינמי אחרי סיום — לא מציגים (יש הודעה אחרת)", () => {
    expect(
      shouldShowTrialActive({ isPro: false, isTrial: false, trialEndsAt: IN_5_DAYS })
    ).toBe(false);
  });
});

/*
  ספירת הימים לפי תאריך בלבד: משתמשת שנכנסת בערב לא אמורה לראות יום פחות
  ממי שנכנסה באותו יום בבוקר.
*/
describe("ספירת הימים שנותרו", () => {
  /*
    התאריכים נבנים בשעון המקומי ולא ב-UTC, כי זה מה שהמשתמשת רואה: התאריך
    מוצג ב-toLocaleDateString, והספירה חייבת להסכים איתו. בדיקה שכתובה
    ב-UTC הייתה נכשלת בישראל רק בגלל הפרש השעות, בלי שיש באג.
  */
  const localDate = (y, m, d, h = 12) => new Date(y, m - 1, d, h);
  const iso = (y, m, d, h = 12) => localDate(y, m, d, h).toISOString();

  test("מחר = יום אחד", () => {
    expect(daysLeft(iso(2026, 10, 1), localDate(2026, 9, 30, 23))).toBe(1);
  });

  test("אותו יום = 0, בלי קשר לשעה", () => {
    expect(daysLeft(iso(2026, 10, 1, 8), localDate(2026, 10, 1, 22))).toBe(0);
  });

  test("תאריך לא תקין מחזיר null ולא NaN", () => {
    expect(daysLeft("not-a-date")).toBeNull();
  });
});

test("מציג עד מתי הפרו פתוח וכמה נותר", () => {
  setActive({ id: "a", name: "גן הרימון", isPro: true, isTrial: true, trialEndsAt: IN_5_DAYS });
  renderBanner();

  expect(screen.getByText(/מסלול הפרו פתוח לך — ללא עלות/)).toBeInTheDocument();
  expect(screen.getByText(/עוד 5 ימים/)).toBeInTheDocument();
});

/* מי שיודעת מה היא מקבלת יודעת גם מה היא מאבדת — ולכן הנעילה לא מפתיעה. */
test("מסביר מה קורה אחרי, ושהנתונים נשארים", () => {
  setActive({ id: "a", name: "גן הרימון", isPro: true, isTrial: true, trialEndsAt: IN_5_DAYS });
  renderBanner();

  expect(screen.getByText(/אפשר להמשיך במסלול החינמי/)).toBeInTheDocument();
  expect(screen.getByText(/כל מה שיצרת יישאר במערכת/)).toBeInTheDocument();
});

test("אפשר לסגור, וזה נזכר", async () => {
  setActive({ id: "a", name: "גן הרימון", isPro: true, isTrial: true, trialEndsAt: IN_5_DAYS });
  const { unmount } = renderBanner();

  await userEvent.click(screen.getByRole("button", { name: "סגירת ההודעה" }));
  expect(screen.queryByText(/מסלול הפרו פתוח לך/)).toBeNull();

  unmount();
  renderBanner();
  expect(screen.queryByText(/מסלול הפרו פתוח לך/)).toBeNull();
});
