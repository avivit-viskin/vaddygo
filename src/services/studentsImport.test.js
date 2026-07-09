import { parseStudentRows, importStudents } from "./studentsImport";

/*
  טסטים לניתוח קובץ הייבוא וליצירת התלמידים (UI_SPEC ס' 11).
*/

test("מנתח קובץ עם כותרת: שם ילד מפוצל לפרטי+משפחה, הורה וטלפון", () => {
  const csv =
    "שם הילד,שם ההורה,טלפון\nהילי לוי,דנה לוי,050-1234567\nיובל,אבי,052-7654321";
  const rows = parseStudentRows(csv);

  expect(rows).toHaveLength(2);
  expect(rows[0]).toEqual({
    firstName: "הילי",
    lastName: "לוי",
    parentName: "דנה לוי",
    parentPhoneNumber: "050-1234567",
  });
  // שם בן מילה אחת: שם משפחה ריק
  expect(rows[1]).toEqual({
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
