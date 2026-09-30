/*
  institutionsExcelExport — ייצוא רשימת המוסדות (ועדים) לקובץ אקסל (.xlsx) למנהלת.

  4 עמודות: שם המוסד · שם איש קשר · מספר טלפון · מתי הוקם המוסד. אם אין שם איש
  קשר לוועד — נופלים למייל (בקשת בעלת המוצר). מקבל את הרשימה *המסוננת* מהמסך
  (למשל "נערכו ב-24 שעות האחרונות" או חיפוש), כך שהקובץ מכיל בדיוק את מה שרואים.

  xlsx-js-style (fork של SheetJS שתומך בצביעה) בטעינה עצלה, כמו בייצוא התלמידים.
  מחזיר את מספר השורות שיוצאו (0 = אין מוסדות בסינון הנוכחי).
*/

// תאריך קצר בעברית, או ריק כשאין/לא תקין.
function formatDate(iso) {
  if (!iso) {
    return "";
  }
  try {
    return new Date(iso).toLocaleDateString("he-IL");
  } catch {
    return "";
  }
}

export async function exportInstitutionsToExcel(committees) {
  const list = Array.isArray(committees) ? committees : [];
  if (list.length === 0) {
    return 0;
  }
  const mod = await import("xlsx-js-style");
  const XLSX = mod.default || mod;

  const header = ["שם המוסד", "שם איש קשר", "מספר טלפון", "מתי הוקם המוסד"];
  const aoa = [
    header,
    ...list.map((c) => [
      c.name || "",
      // איש קשר = שם המשתמש של הבעלים; אם אין — המייל (fallback מבוקש).
      (c.contactName || "").trim() || c.email || "",
      c.phone || "",
      formatDate(c.createdAt),
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // כותרת בורוד המותג, לבן ומודגש — אותו עיצוב של ייצוא התלמידים.
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "C25C8A" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
  header.forEach((_, c) => {
    const ref = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[ref]) {
      ws[ref].s = headerStyle;
    }
  });

  ws["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 16 }, { wch: 16 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "מוסדות");
  // תצוגה מימין לשמאל (עברית)
  wb.Workbook = { Views: [{ RTL: true }] };

  const stamp = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");
  XLSX.writeFile(wb, `מוסדות - VaddyGo ${stamp}.xlsx`);
  return list.length;
}
