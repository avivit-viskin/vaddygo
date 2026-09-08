/*
  studentsExcelExport — ייצוא רשימת התלמידים לקובץ אקסל (.xlsx) לוועד.

  עמודות: שם, שם משפחה, טלפון הורה, עמודה לכל קטגוריית תשלום (עם הסכום המבוקש
  בכותרת, למשל "הזנה (₪500)"), ולבסוף עמודת "יתרה לתשלום" — סך מה שהתלמיד עוד
  חייב בכל הקטגוריות. כל תא קטגוריה צבוע לפי הסטטוס: ירוק "שולם", צהוב "חלקית",
  אדום "לא שולם".

  הייצוא מכבד את הסינון במסך: מקבל את רשימת התלמידים המסוננת (visibleStudents).
  אם לא הועברה רשימה — מייצא את כל התלמידים (תאימות לאחור).

  התאמת תשלום↔קטגוריה נעשית לפי *שם הקטגוריה* (הגדרת הגן המקומית לא כוללת מזהה
  שרת). משתמש ב-xlsx-js-style (fork של SheetJS שתומך בצביעה) בטעינה עצלה.
*/
import { getStudents } from "./studentsService";
import {
  getAllStudentPayments,
  amountPaidSoFar,
  amountRemaining,
  isCategoryFullyPaid,
} from "./paymentsService";
import { getOnboarding } from "./onboardingService";

// צבעי מילוי (RGB בלי #) — רך ותואם לאקסל
const FILL = { paid: "C6EFCE", partial: "FFEB9C", unpaid: "FFC7CE" };
const FONT = { paid: "1D6F42", partial: "9C6500", unpaid: "9C0006" };
const LABEL = { paid: "שולם", partial: "חלקית", unpaid: "לא שולם" };

// סטטוס תשלום בקטגוריה אחת של תלמיד: שולם במלואו / חלקי / לא שולם.
function statusFor(payment) {
  if (!payment) return "unpaid";
  if (isCategoryFullyPaid(payment)) return "paid";
  if (amountPaidSoFar(payment) > 0) return "partial";
  return "unpaid";
}

/*
  אוסף תלמידים + כל שורות התשלום, בונה גיליון צבוע ומוריד קובץ. מקבל רשימת
  תלמידים מסוננת (אופציונלי). מחזיר את מספר התלמידים שיוצאו (0 = אין תלמידים).
*/
export async function exportStudentsToExcel(filteredStudents) {
  const [mod, students, rows] = await Promise.all([
    import("xlsx-js-style"),
    Array.isArray(filteredStudents)
      ? Promise.resolve(filteredStudents)
      : getStudents().then((s) => s || []),
    getAllStudentPayments()
      .then((r) => r || [])
      .catch(() => []),
  ]);
  const XLSX = mod.default || mod;
  if (students.length === 0) {
    return 0;
  }

  // מפה: studentId → (שם קטגוריה → שורת תשלום)
  const byStudent = new Map();
  rows.forEach((p) => {
    const sid = Number(p.studentId);
    let m = byStudent.get(sid);
    if (!m) {
      m = new Map();
      byStudent.set(sid, m);
    }
    if (p.categoryName) {
      m.set(p.categoryName, p);
    }
  });

  // עמודות הקטגוריות: לפי הגדרת הגן (סדר קבוע); אם אין — נגזור משמות שבתשלומים.
  let categoryNames = (getOnboarding()?.categories || [])
    .map((c) => c.name)
    .filter(Boolean);
  if (categoryNames.length === 0) {
    const seen = new Set();
    rows.forEach((p) => p.categoryName && seen.add(p.categoryName));
    categoryNames = [...seen];
  }

  // הסכום המבוקש לכל קטגוריה — קודם מהגדרת הגן (amountPerChild), ואם אין, מתוך
  // שורת תשלום כלשהי של אותה קטגוריה. משמש גם בכותרת וגם בחישוב היתרה.
  const amountByName = new Map();
  (getOnboarding()?.categories || []).forEach((c) => {
    if (c.name && Number(c.amount) > 0) amountByName.set(c.name, Number(c.amount));
  });
  rows.forEach((p) => {
    if (p.categoryName && !amountByName.has(p.categoryName) && Number(p.amount) > 0) {
      amountByName.set(p.categoryName, Number(p.amount));
    }
  });

  // כותרת: פרטים + קטגוריה עם סכום מבוקש + עמודת יתרה לתשלום
  const catHeader = (name) =>
    amountByName.has(name) ? `${name} (₪${amountByName.get(name)})` : name;
  const header = [
    "שם",
    "שם משפחה",
    "טלפון הורה",
    ...categoryNames.map(catHeader),
    "יתרה לתשלום (₪)",
  ];
  const aoa = [header];
  const statusMeta = []; // סטטוס לכל תא-קטגוריה, לצביעה אחרי הבנייה
  const remainingMeta = []; // יתרה לכל שורה, לצביעה (אדום=חייב, ירוק=סגר)
  students.forEach((s) => {
    const m = byStudent.get(Number(s.id)) || new Map();
    const row = [s.firstName || "", s.lastName || "", s.parentPhoneNumber || ""];
    const rowStatus = [];
    let remaining = 0;
    categoryNames.forEach((name) => {
      const p = m.get(name);
      const st = statusFor(p);
      row.push(LABEL[st]);
      rowStatus.push(st);
      // יתרה: אם יש שורת תשלום — לפי הנותר בה; אם אין — חייב את מלוא סכום הקטגוריה.
      remaining += p ? amountRemaining(p) : amountByName.get(name) || 0;
    });
    row.push(remaining);
    aoa.push(row);
    statusMeta.push(rowStatus);
    remainingMeta.push(remaining);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // עיצוב כותרת — ורוד המותג, לבן ומודגש
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "C25C8A" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
  header.forEach((_, c) => {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[ref]) ws[ref].s = headerStyle;
  });

  // צביעת תאי הקטגוריות לפי סטטוס (העמודות מתחילות אחרי 3 עמודות הפרטים)
  statusMeta.forEach((rowStatus, ri) => {
    rowStatus.forEach((st, ci) => {
      const ref = XLSX.utils.encode_cell({ r: ri + 1, c: ci + 3 });
      if (!ws[ref]) return;
      ws[ref].s = {
        fill: { fgColor: { rgb: FILL[st] } },
        font: { color: { rgb: FONT[st] }, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
      };
    });
  });

  // עמודת "יתרה לתשלום" — אחרי כל הקטגוריות. אדום אם עוד חייב, ירוק אם סגר הכל.
  const remainingCol = 3 + categoryNames.length;
  remainingMeta.forEach((remaining, ri) => {
    const ref = XLSX.utils.encode_cell({ r: ri + 1, c: remainingCol });
    if (!ws[ref]) return;
    ws[ref].s = {
      font: {
        bold: true,
        color: { rgb: remaining > 0 ? "9C0006" : "1D6F42" },
      },
      alignment: { horizontal: "center", vertical: "center" },
    };
  });

  // רוחב עמודות
  ws["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    ...categoryNames.map(() => ({ wch: 16 })),
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "תלמידים");
  // תצוגה מימין לשמאל (עברית)
  wb.Workbook = { Views: [{ RTL: true }] };

  const ganName = getOnboarding()?.ganName;
  const fileName = ganName
    ? `רשימת תלמידים - ${ganName}.xlsx`
    : "רשימת תלמידים - VaddyGo.xlsx";
  XLSX.writeFile(wb, fileName);

  return students.length;
}
