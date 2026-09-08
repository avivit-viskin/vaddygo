import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HelpVideoButton from "./HelpVideoButton";
import { toEmbed } from "../config/video";

/*
  הכתובת נקבעת פעם אחת בטעינת המודול, ולכן כדי לבדוק "יש סרטון" ו"אין סרטון"
  באותו קובץ מחליפים את מודול ההגדרות במשתנה שאפשר לשנות בין הטסטים.

  ⚠️ לא jest.isolateModules: טעינה מבודדת מביאה עותק **שני** של React, וה-hooks
  של הרכיב נשברים מול הרנדרר. המימוש האמיתי של ההמרה נשמר — כשמעבירים כתובת
  במפורש, הקריאה עוברת אליו.
*/
let mockUrl = "";
jest.mock("../config/video", () => {
  const actual = jest.requireActual("../config/video");
  return {
    ...actual,
    toEmbed: (url) => actual.toEmbed(url === undefined ? mockUrl : url),
    hasHelpVideo: () => actual.toEmbed(mockUrl) !== null,
  };
});

beforeEach(() => {
  mockUrl = "";
});

describe("המרת כתובת הסרטון", () => {
  /*
    זו כל הנקודה: מדביקים קישור רגיל מיוטיוב וזה עובד. אף אחד לא אמור לדעת
    מה ההבדל בין כתובת צפייה לכתובת הטמעה.
  */
  test("קישור צפייה רגיל מיוטיוב", () => {
    expect(toEmbed("https://www.youtube.com/watch?v=abc123XYZ")).toEqual({
      kind: "iframe",
      src: "https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0",
    });
  });

  test("קישור מקוצר youtu.be", () => {
    expect(toEmbed("https://youtu.be/abc123XYZ").src).toContain(
      "youtube-nocookie.com/embed/abc123XYZ"
    );
  });

  /* פרטיות: לעולם לא הדומיין שמשתיל עוגיות פרסום */
  test("תמיד עובר דרך nocookie", () => {
    const forms = [
      "https://www.youtube.com/watch?v=abc123XYZ&t=10",
      "https://youtu.be/abc123XYZ",
      "https://www.youtube.com/embed/abc123XYZ",
      "https://www.youtube.com/shorts/abc123XYZ",
    ];
    forms.forEach((url) => {
      expect(toEmbed(url).src).toMatch(/^https:\/\/www\.youtube-nocookie\.com\//);
    });
  });

  test("Vimeo", () => {
    expect(toEmbed("https://vimeo.com/123456789")).toEqual({
      kind: "iframe",
      src: "https://player.vimeo.com/video/123456789",
    });
  });

  test("קובץ mp4 ישיר מנוגן כקובץ ולא כמסגרת", () => {
    expect(toEmbed("https://cdn.example.com/tour.mp4").kind).toBe("file");
  });

  test("כתובת ריקה או לא מזוהה מחזירה null", () => {
    expect(toEmbed("")).toBeNull();
    expect(toEmbed("   ")).toBeNull();
    expect(toEmbed("https://example.com/עמוד")).toBeNull();
  });
});

describe("הכפתור", () => {
  /*
    ההחלטה החשובה ביותר ברכיב: בלי כתובת אין כפתור. כפתור שפותח חלון ריק
    גרוע יותר מהיעדר כפתור.
  */
  test("בלי סרטון מוגדר — לא מוצג כלום", () => {
    mockUrl = "";
    const { container } = render(<HelpVideoButton />);
    expect(container).toBeEmptyDOMElement();
  });

  test("עם סרטון — מוצג כפתור, והנגן נטען רק בלחיצה", async () => {
    mockUrl = "https://youtu.be/abc123XYZ";
    render(<HelpVideoButton label="לראות איך מוסיפים תלמידים" />);

    const button = screen.getByRole("button", {
      name: /לראות איך מוסיפים תלמידים/,
    });
    // לפני הלחיצה אין iframe — כלומר אין בקשה ליוטיוב ואין עוגיות
    expect(document.querySelector("iframe")).toBeNull();

    await userEvent.click(button);
    const frame = document.querySelector("iframe");
    expect(frame).not.toBeNull();
    expect(frame.getAttribute("src")).toContain("youtube-nocookie.com");
  });

  test("קורא ל-onOpen כדי שהתפריט ייסגר לפני שהחלון נפתח", async () => {
    mockUrl = "https://youtu.be/abc123XYZ";
    const onOpen = jest.fn();
    render(<HelpVideoButton label="סרטון הסבר" onOpen={onOpen} />);

    await userEvent.click(screen.getByRole("button", { name: /סרטון הסבר/ }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
