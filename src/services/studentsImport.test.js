import {
  parseStudentRows,
  parseStudentGrid,
  sheetToGrid,
  buildColumnMap,
  importStudents,
} from "./studentsImport";

/*
  טסטים לניתוח קובץ הייבוא וליצירת התלמידים (UI_SPEC ס' 11): הקובץ הפשוט
  (שם הילד/הורה/טלפון) וגם קובץ משרד החינוך הרחב (זיהוי עמודות לפי שם).
*/

test("קובץ פשוט עם כותרת: שם ילד מפוצל לפרטי+משפחה, הורה וטלפון", () => {
  const csv =
    "שם הילד,שם ההורה,טלפון\nהילי לוי,דנה לוי,050-1234567\nיובל,אבי,052-7654321";
  const rows = parseStudentRows(csv);

  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({
    firstName: "הילי",
    lastName: "לוי",
    parentName: "דנה לוי",
    parentPhoneNumber: "050-1234567",
  });
  // שם בן מילה אחת: שם משפחה ריק
  expect(rows[1]).toMatchObject({
    firstName: "יובל",
    lastName: "",
    parentName: "אבי",
    parentPhoneNumber: "052-7654321",
  });
});

test("מזהה מפריד נקודה-פסיק (אקסל בעברית)", () => {
  const rows = parseStudentRows("שם הילד;שם ההורה;טלפון\nנועה כהן;רוני כהן;050-0000000");
  expect(rows).toHaveLength(1);
  expect(rows[0].firstName).toBe("נועה");
  expect(rows[0].parentName).toBe("רוני כהן");
});

test("קובץ בלי שורת כותרת עדיין נקרא", () => {
  const rows = parseStudentRows("הילי לוי,דנה לוי,050-1234567");
  expect(rows).toHaveLength(1);
  expect(rows[0].firstName).toBe("הילי");
});

test("parseStudentGrid מנתח טבלת Excel פשוטה ומדלג על שורת הכותרת", () => {
  const grid = [
    ["שם הילד", "שם ההורה", "טלפון"],
    ["הילי לוי", "דנה לוי", "050-1234567"],
    ["יובל", "אבי", "052-7654321"],
  ];
  const rows = parseStudentGrid(grid);

  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({
    firstName: "הילי",
    lastName: "לוי",
    parentName: "דנה לוי",
    parentPhoneNumber: "050-1234567",
  });
  expect(rows[1].firstName).toBe("יובל");
  expect(rows[1].lastName).toBe("");
});

test("parseStudentGrid: טלפון מספרי הופך למחרוזת, ותאים ריקים לא מפילים", () => {
  const grid = [["דן כהן", null, 501234567]];
  const rows = parseStudentGrid(grid);

  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    firstName: "דן",
    lastName: "כהן",
    parentName: "",
    parentPhoneNumber: "501234567",
  });
});

test("sheetToGrid לוקח את נתוני הגיליון הראשון שיש בו שורות (מבנה read-excel-file v9)", () => {
  const result = [
    { sheet: "ריק", data: [] },
    {
      sheet: "תלמידים",
      data: [
        ["שם הילד", "שם ההורה", "טלפון"],
        ["הילי לוי", "דנה לוי", "050-1234567"],
        ["יובל כהן", "אבי כהן", "052-7654321"],
      ],
    },
  ];

  const grid = sheetToGrid(result);
  expect(grid).toHaveLength(3);

  const students = parseStudentGrid(grid);
  expect(students).toHaveLength(2);
  expect(students[0].firstName).toBe("הילי");
  expect(students[1].firstName).toBe("יובל");
});

test("sheetToGrid תואם גם לגרסה שמחזירה מערך שורות ישירות", () => {
  const rows = [["דן כהן", "אבי", "0501112223"]];
  expect(sheetToGrid(rows)).toBe(rows);
  expect(sheetToGrid([])).toEqual([]);
  expect(sheetToGrid(null)).toEqual([]);
});

/* ── קובץ משרד החינוך (עמודות מרובות, זיהוי לפי שם) ─────────── */

const MINISTRY_HEADERS = [
  "שם פרטי",
  "שם משפחה",
  "תעודת זהות",
  "מין",
  "תאריך לידה",
  "אלרגיה",
  "רחוב",
  "בית",
  "דירה",
  "שם פרטי הורה א'",
  "שם משפחה הורה א'",
  "טלפון הורה א'",
  'דוא"ל הורה א\'',
  "שם פרטי הורה ב'",
  "שם משפחה הורה ב'",
  "טלפון הורה ב'",
  'דוא"ל הורה ב\'',
  "האם ההורים נשואים",
];

test("buildColumnMap ממפה את כל עמודות קובץ משרד החינוך לשדות הנכונים", () => {
  const map = buildColumnMap(MINISTRY_HEADERS);
  expect(map).toMatchObject({
    firstName: 0,
    lastName: 1,
    idNumber: 2,
    gender: 3,
    birthDate: 4,
    allergies: 5,
    street: 6,
    houseNumber: 7,
    apartment: 8,
    parentAFirst: 9,
    parentALast: 10,
    parentAPhone: 11,
    parentAEmail: 12,
    parentBFirst: 13,
    parentBLast: 14,
    parentBPhone: 15,
    parentBEmail: 16,
    married: 17,
  });
});

test("קובץ משרד החינוך: כל השדות נשלפים, כתובת מורכבת ושמות הורים מאוחדים", () => {
  const grid = [
    MINISTRY_HEADERS,
    [
      "הילי",
      "לוי",
      "123456789",
      "נ",
      "2020-05-12",
      "בוטנים",
      "הרצל",
      "5",
      "3",
      "דנה",
      "לוי",
      "050-1234567",
      "dana@example.com",
      "אבי",
      "לוי",
      "052-7654321",
      "avi@example.com",
      "כן",
    ],
  ];
  const rows = parseStudentGrid(grid);

  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    firstName: "הילי",
    lastName: "לוי",
    idNumber: "123456789",
    gender: "נ",
    birthDate: "2020-05-12",
    allergies: "בוטנים",
    address: "הרצל 5, דירה 3",
    parentName: "דנה לוי",
    parentPhoneNumber: "050-1234567",
    parentEmail: "dana@example.com",
    parentBName: "אבי לוי",
    parentBPhone: "052-7654321",
    parentBEmail: "avi@example.com",
    parentsMarried: "כן",
  });
});

test("תאריך לידה נקרא גם מפורמט dd/mm/yyyy וגם מאובייקט Date של אקסל", () => {
  const grid = [
    ["שם פרטי", "שם משפחה", "תאריך לידה"],
    ["נועה", "כהן", "12/05/2020"],
    ["רון", "לוי", new Date(2019, 10, 3)], // 3.11.2019
  ];
  const rows = parseStudentGrid(grid);
  expect(rows[0].birthDate).toBe("2020-05-12");
  expect(rows[1].birthDate).toBe("2019-11-03");
});

test("סדר עמודות שונה — הזיהוי לפי שם ולא לפי מיקום", () => {
  const grid = [
    ["טלפון הורה א'", "שם משפחה", "שם פרטי"],
    ["050-9999999", "כהן", "מאיה"],
  ];
  const rows = parseStudentGrid(grid);
  expect(rows[0]).toMatchObject({
    firstName: "מאיה",
    lastName: "כהן",
    parentPhoneNumber: "050-9999999",
  });
});

test("קובץ פשוט: שם תלמיד, טלפון ותאריך לידה בלבד (בלי שאר השדות)", () => {
  const grid = [
    ["שם תלמיד", "טלפון", "תאריך לידה"],
    ["הילי לוי", "050-1234567", "12/05/2020"],
  ];
  const rows = parseStudentGrid(grid);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    firstName: "הילי",
    lastName: "לוי",
    parentPhoneNumber: "050-1234567",
    birthDate: "2020-05-12",
  });
});

test("תאריך לידה כמספר סידורי של אקסל מומר נכון", () => {
  const grid = [
    ["שם פרטי", "תאריך לידה"],
    ["נועה", 43535], // 11.3.2019 בלוח השנה של אקסל
  ];
  const rows = parseStudentGrid(grid);
  expect(rows[0].birthDate).toBe("2019-03-11");
});

test("מזהה את שורת הכותרת גם כשמעליה שורות כותרת/שם מוסד (קובץ משרד החינוך)", () => {
  const grid = [
    ["גן הדס — רשימת תלמידים"],
    ["הופק בתאריך 14/07/2026"],
    [],
    ["שם פרטי", "שם משפחה", "טלפון הורה א'", "תאריך לידה"],
    ["נועה", "כהן", "050-0000000", "03/11/2019"],
  ];
  const rows = parseStudentGrid(grid);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    firstName: "נועה",
    lastName: "כהן",
    parentPhoneNumber: "050-0000000",
    birthDate: "2019-11-03",
  });
});

test("importStudents מסכם כמה נוספו וכמה נכשלו", async () => {
  const rows = [
    { firstName: "א", lastName: "", parentName: "", parentPhoneNumber: "0500000000" },
    { firstName: "ב", lastName: "", parentName: "", parentPhoneNumber: "בעייתי" },
  ];
  const createFn = jest.fn((s) => {
    if (s.parentPhoneNumber === "בעייתי") {
      return Promise.reject(new Error("טלפון לא תקין"));
    }
    return Promise.resolve({ id: 1, ...s });
  });

  const result = await importStudents(rows, createFn);

  expect(result.added).toBe(1);
  expect(result.failed).toHaveLength(1);
  expect(result.failed[0].name).toBe("ב");
  expect(createFn).toHaveBeenCalledTimes(2);
});

test("importStudents שולח את השדות הנוספים לשרת", async () => {
  const rows = [
    {
      firstName: "הילי",
      lastName: "לוי",
      parentName: "דנה לוי",
      parentPhoneNumber: "0501234567",
      birthDate: "2020-05-12",
      idNumber: "123456789",
      allergies: "בוטנים",
      parentBName: "אבי לוי",
      parentsMarried: "כן",
    },
  ];
  const createFn = jest.fn(() => Promise.resolve({ id: 1 }));
  await importStudents(rows, createFn);

  expect(createFn).toHaveBeenCalledWith(
    expect.objectContaining({
      firstName: "הילי",
      birthDate: "2020-05-12",
      idNumber: "123456789",
      allergies: "בוטנים",
      parentBName: "אבי לוי",
      parentsMarried: "כן",
    })
  );
});
