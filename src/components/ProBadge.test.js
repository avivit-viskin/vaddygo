import { render, screen } from "@testing-library/react";
import ProBadge from "./ProBadge";
import { isPro } from "../services/plan";

jest.mock("../services/plan", () => ({ isPro: jest.fn() }));

/*
  כלל התצוגה (החלטת בעלת המוצר, 10.08.2026): הכתר מסמן פיצ'ר שעדיין **לא נרכש**
  — ונעלם ברגע שהמסלול נרכש. זו ההתנהגות היחידה שנבדקת כאן.
*/
beforeEach(() => jest.clearAllMocks());

test("צד הוועד: כתר מוצג כשאין פרו", () => {
  isPro.mockReturnValue(false);
  render(<ProBadge title="פיצ'ר פרו" />);
  expect(screen.getByTitle("פיצ'ר פרו")).toBeInTheDocument();
});

test("צד הוועד: הכתר נעלם אחרי רכישת פרו", () => {
  isPro.mockReturnValue(true);
  const { container } = render(<ProBadge title="פיצ'ר פרו" />);
  expect(container).toBeEmptyDOMElement();
});

test("צד הספק: הכתר נקבע לפי isPro שמועבר, ולא לפי הוועד", () => {
  // הוועד פרו — ואם הרכיב היה מסתמך עליו, הכתר של הספק היה נעלם בטעות
  isPro.mockReturnValue(true);
  render(<ProBadge title="פיצ'ר פרו" isPro={false} />);
  expect(screen.getByTitle("פיצ'ר פרו")).toBeInTheDocument();
});

test("צד הספק: ספק שרכש פרו לא רואה כתר", () => {
  isPro.mockReturnValue(false);
  const { container } = render(<ProBadge title="פיצ'ר פרו" isPro />);
  expect(container).toBeEmptyDOMElement();
});
