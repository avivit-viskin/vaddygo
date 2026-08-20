/*
  studentsExcelExport — ייצוא רשימת כל התלמידים לקובץ אקסל (.xlsx) לוועד.
  עמודות: שם, שם משפחה, טלפון הורה, ואז עמודה לכל קטגוריית תשלום שהוועד הגדיר.
  כל תא קטגוריה צבוע לפי הסטטוס: ירוק "שולם", צהוב "חלקית", אדום "לא שולם".

  התאמת תשלום↔קטגוריה נעשית לפי *שם הקטגוריה* — כי הגדרת הגן המקומית
  (getOnboarding) לא כוללת מזהה שרת, רק שם. מושכים את כל שורות התשלום בבקשה
  אחת (getAllStudentPayments) במקום בקשה לכל תלמיד.

  משתמש ב-xlsx-js-style (fork של SheetJS שתומך בצביעת תאים) בטעינה עצלה.
*/
import { getStudents } from "./studentsService";
import {
  getAllStudentPayments,
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
  אוסף את כל התלמידים + כל שורות התשלום, בונה גיליון צבוע ומוריד קובץ.
  מחזיר את מספר התלמידים שיוצאו (0 = אין תלמידים).
*/
export async function exportStudentsToExcel() {
  const [mod, students, rows] = await Promise.all([
    import("xlsx-js-style"),
    getStudents().then((s) => s || []),
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

  const header = ["שם", "שם משפחה", "טלפון הורה", ...categoryNames];
  const aoa = [header];
  const statusMeta = []; // סטטוס לכל תא-קטגוריה, לצביעה אחרי הבנייה
  students.forEach((s) => {
    const m = byStudent.get(Number(s.id)) || new Map();
    const row = [s.firstName || "", s.lastName || "", s.parentPhoneNumber || ""];
    const rowStatus = [];
    categoryNames.forEach((name) => {
      const st = statusFor(m.get(name));
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
    ...categoryNames.map(() => ({ wch: 12 })),
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
