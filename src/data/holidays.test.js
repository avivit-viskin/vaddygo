import {
  getHolidaysForMonth,
  getHolidayOccurrencesForMonth,
  getRoshChodeshForMonth,
} from "./holidays";

/*
  בדיקות ללוגיקת החגים: ערבי חג וראש חודש. הבדיקות אינן מקבעות תאריכים
  לועזיים "בעל פה" — הן משתמשות באותו מנוע לוח עברי (Intl) כדי לאמת שהתא
  הנכון סומן, כך שהן נכונות בכל שנה.
*/
const hebrewFormatter = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  day: "numeric",
  month: "long",
});
function hebrew(year, monthIndex, day) {
  const parts = hebrewFormatter.formatToParts(new Date(year, monthIndex, day, 12));
  return {
    day: Number(parts.find((p) => p.type === "day").value),
    month: parts.find((p) => p.type === "month").value,
  };
}

const YEAR = 2026;

describe("ערבי חג", () => {
  test('"ערב פסח" מסומן ביום שלפני פסח (י"ד בניסן)', () => {
    let found = false;
    for (let m = 0; m < 12; m++) {
      const map = getHolidaysForMonth(YEAR, m);
      const daysInMonth = new Date(YEAR, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const h = hebrew(YEAR, m, day);
        if (h.month === "Nisan" && h.day === 14) {
          expect(map.get(day)).toContain("ערב פסח");
          found = true;
        }
      }
    }
    expect(found).toBe(true); // ודא שאכן נבדק (י"ד בניסן קיים ב-2026)
  });

  test("אין מופע נפרד בשם 'ערב ...' — הערב מתמזג לתוך מופע החג", () => {
    for (let m = 0; m < 12; m++) {
      const occ = getHolidayOccurrencesForMonth(YEAR, m);
      expect(occ.every((o) => !o.name.startsWith("ערב "))).toBe(true);
    }
  });

  test("הערב חג הוא היום הראשון של מופע החג (התאריך מתחיל ממנו)", () => {
    let checked = false;
    for (let m = 0; m < 12; m++) {
      const pesach = getHolidayOccurrencesForMonth(YEAR, m).find(
        (o) => o.name === "פסח"
      );
      if (!pesach) continue;
      const daysInMonth = new Date(YEAR, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const h = hebrew(YEAR, m, day);
        if (h.month === "Nisan" && h.day === 14) {
          expect(pesach.days).toContain(day); // הערב נכלל במופע
          expect(pesach.days[0]).toBe(day); // והוא היום הראשון
          expect(pesach.eveDays).toContain(day); // ומסומן כערב
          checked = true;
        }
      }
    }
    expect(checked).toBe(true);
  });
});

describe("ראש חודש", () => {
  test("כל יום שמוחזר הוא א' לחודש העברי", () => {
    for (let m = 0; m < 12; m++) {
      for (const day of getRoshChodeshForMonth(YEAR, m)) {
        expect(hebrew(YEAR, m, day).day).toBe(1);
      }
    }
  });

  test("א' בתשרי (ראש השנה) אינו מסומן כראש חודש", () => {
    for (let m = 0; m < 12; m++) {
      const rc = getRoshChodeshForMonth(YEAR, m);
      const daysInMonth = new Date(YEAR, m + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const h = hebrew(YEAR, m, day);
        if (h.month === "Tishri" && h.day === 1) {
          expect(rc.has(day)).toBe(false);
        }
      }
    }
  });

  test("מסומנים רוב ראשי החודש לאורך השנה", () => {
    let total = 0;
    for (let m = 0; m < 12; m++) total += getRoshChodeshForMonth(YEAR, m).size;
    expect(total).toBeGreaterThanOrEqual(9);
  });
});
