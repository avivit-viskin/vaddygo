import { render, screen } from "@testing-library/react";
import YearEndCleanupBanner from "./YearEndCleanupBanner";

/*
  🔴 באג שדווח מהשטח: "תזוזה של הקטגוריות, מסך רועד".

  שלושה באנרים במסך הבית הופיעו **אחרי** שהעמוד כבר צויר — אחד מהם שלף
  נתונים מהשרת — ודחפו את התוכן שמתחתם למטה בכל טעינה. הבדיקות כאן נועלות את
  התיקון: ההחלטה מתקבלת מנתונים שכבר קיימים במכשיר, בלי קריאת רשת.
*/
function setInstitution(inst) {
  localStorage.setItem("vaadygo.institutions", JSON.stringify([inst]));
  localStorage.setItem("vaadygo.activeInstitution", inst.id);
}

const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString();

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn(() => {
    throw new Error("הבאנר לא אמור לפנות לשרת");
  });
});

test("מציג אזהרה כשהמועד בתוך שבועיים — בלי קריאת רשת", () => {
  setInstitution({ id: "a", serverGroupId: 1, name: "גן", nextCleanupAt: inDays(5) });

  render(<YearEndCleanupBanner />);

  expect(screen.getByText(/נתוני השנה/)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test("מועד רחוק — לא מוצג כלום (ולכן שום דבר לא נדחף)", () => {
  setInstitution({ id: "a", serverGroupId: 1, name: "גן", nextCleanupAt: inDays(200) });

  const { container } = render(<YearEndCleanupBanner />);
  expect(container).toBeEmptyDOMElement();
});

test("בלי מועד — לא מוצג כלום", () => {
  setInstitution({ id: "a", serverGroupId: 1, name: "גן", nextCleanupAt: null });

  const { container } = render(<YearEndCleanupBanner />);
  expect(container).toBeEmptyDOMElement();
});
