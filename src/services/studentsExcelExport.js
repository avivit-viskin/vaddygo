/*
  studentsExcelExport — ייצוא רשימת כל התלמידים לקובץ אקסל (.xlsx) לוועד.
  עמודות: שם, שם משפחה, טלפון הורה, ואז עמודה לכל קטגוריית תשלום שהוועד הגדיר.
  כל תא קטגוריה צבוע לפי הסטטוס: ירוק "שולם", צהוב "חלקית", אדום "לא שולם".

  משתמש ב-xlsx-js-style (fork של SheetJS שתומך בצביעת תאים) בטעינה עצלה
  (dynamic import) כדי לא להעמיס על ה-bundle הראשי.
*/
import { getStudents } from "./studentsService";
import {
  getStudentPayments,
  amountPaidSoFar,
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
  אוסף את כל התלמידים + התשלומים שלהם, בונה גיליון צבוע ומוריד קובץ.
  מחזיר את מספר התלמידים שיוצאו (0 = אין תלמידים).
*/
export async function exportStudentsToExcel() {
  const [mod, students] = await Promise.all([
    import("xlsx-js-style"),
    getStudents().then((s) => s || []),
  ]);
  const XLSX = mod.default || mod;
  if (students.length === 0) {
    return 0;
  }

  const categories = getOnboarding()?.categories || [];

  // תשלומים לכל תלמיד — במקביל; אם קריאה נכשלת, מתייחסים כאילו אין תשלומים.
  const paymentsByStudent = await Promise.all(
    students.map((s) => getStudentPayments(s.id).catch(() => []))
  );

  const header = [
    "שם",
    "שם משפחה",
    "טלפון הורה",
    ...categories.map((c) => c.name),
  ];

  const aoa = [header];
  const statusMeta = []; // סטטוס לכל תא-קטגוריה, לצביעה אחרי הבנייה
  students.forEach((s, i) => {
    const byCat = new Map();
    (paymentsByStudent[i] || []).forEach((p) =>
      byCat.set(p.collectionCategoryId, p)
    );
    const row = [s.firstName || "", s.lastName || "", s.parentPhoneNumber || ""];
    const rowStatus = [];
    categories.forEach((c) => {
      const st = statusFor(byCat.get(c.id));
      row.push(LABEL[st]);
      rowStatus.push(st);
    });
    aoa.push(row);
    statusMeta.push(rowStatus);
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

  // רוחב עמודות
  ws["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    ...categories.map(() => ({ wch: 12 })),
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
