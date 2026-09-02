import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SupplierTrialBanner, {
  shouldShowSupplierTrial,
  daysLeft,
} from "./SupplierTrialBanner";

const IN_5_DAYS = new Date(Date.now() + 5 * 86400000).toISOString();

beforeEach(() => localStorage.clear());

describe("מתי הבאנר מוצג לספק", () => {
  test("פרו פתוח ללא עלות — מציגים", () => {
    expect(
      shouldShowSupplierTrial({ isPro: true, isTrial: true, trialEndsAt: IN_5_DAYS })
    ).toBe(true);
  });

  /*
    זו ההבחנה שכל השינוי נשען עליה: בזמן המבצע isPro דלוק אצל כל הספקים,
    ולכן ספק שרכש היה מקבל "זה בחינם" על משהו ששילם עליו.
  */
  test("ספק שרכש פרו — לא מציגים", () => {
    expect(
      shouldShowSupplierTrial({ isPro: true, isTrial: false, trialEndsAt: null })
    ).toBe(false);
  });

  test("ספק בלי פרו כלל — לא מציגים", () => {
    expect(shouldShowSupplierTrial({ isPro: false })).toBe(false);
    expect(shouldShowSupplierTrial(null)).toBe(false);
  });
});

describe("ספירת הימים", () => {
  /*
    תאריכים מקומיים ולא UTC: הפונקציה משווה ימי-לוח כפי שהמשתמש רואה אותם,
    ובדיקה שכתובה ב-UTC הייתה נותנת תוצאה אחרת בישראל מאשר בלונדון.
  */
  test("מחשבת לפי תאריך ולא לפי שעה", () => {
    const lateAtNight = new Date(2026, 8, 3, 23, 30);
    expect(daysLeft(new Date(2026, 9, 1).toISOString(), lateAtNight)).toBe(28);
    // אותו יום, שעה אחרת — אותה תשובה
    const earlyMorning = new Date(2026, 8, 3, 0, 5);
    expect(daysLeft(new Date(2026, 9, 1).toISOString(), earlyMorning)).toBe(28);
  });

  test("תאריך לא תקין מחזיר null ולא קורס", () => {
    expect(daysLeft("לא-תאריך")).toBeNull();
  });
});

describe("התצוגה", () => {
  const vendor = { id: 7, isPro: true, isTrial: true, trialEndsAt: IN_5_DAYS };

  test("אומר שהפרו פתוח ללא עלות ומה נכלל", () => {
    render(<SupplierTrialBanner vendor={vendor} />);

    expect(screen.getByText(/ללא עלות/)).toBeInTheDocument();
    expect(screen.getByText(/עוד 5 ימים/)).toBeInTheDocument();
    // הפניות הן הפיצ'ר שבגללו הספק נשאר — הוא חייב להופיע בשמו
    expect(screen.getByText(/הפניות שוועדים שולחים אליך/)).toBeInTheDocument();
  });

  test("מבטיח שהכרטיס נשאר — זה החשש המיידי", () => {
    render(<SupplierTrialBanner vendor={vendor} />);
    expect(screen.getByText(/רק הפיצ'רים האלה ננעלים/)).toBeInTheDocument();
  });

  test("סגירה נזכרת לספק הזה", async () => {
    const { unmount } = render(<SupplierTrialBanner vendor={vendor} />);
    await userEvent.click(screen.getByLabelText("סגירת ההודעה"));
    expect(screen.queryByText(/ללא עלות/)).not.toBeInTheDocument();

    unmount();
    render(<SupplierTrialBanner vendor={vendor} />);
    expect(screen.queryByText(/ללא עלות/)).not.toBeInTheDocument();
  });

  test("סגירה אצל ספק אחד לא מסתירה אצל אחר", async () => {
    const { unmount } = render(<SupplierTrialBanner vendor={vendor} />);
    await userEvent.click(screen.getByLabelText("סגירת ההודעה"));
    unmount();

    render(<SupplierTrialBanner vendor={{ ...vendor, id: 8 }} />);
    expect(screen.getByText(/ללא עלות/)).toBeInTheDocument();
  });
});
