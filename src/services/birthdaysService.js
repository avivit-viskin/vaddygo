import { getStaff } from "./staffService";
import { getStudents } from "./studentsService";

/*
  birthdaysService — ימי-הולדת לתצוגה בלוח השנה. מאחד את אנשי הצוות ואת
  התלמידים (שניהם עם תאריך לידה) לרשימה אחת, כדי שהלוח יהיה מסונכרן אוטומטית
  עם מי שהוזן במערכת. יום ההולדת חוזר כל שנה, ולכן התצוגה בלוח היא לפי היום
  והחודש בלבד (בלי שנת הלידה).
*/

/* טוען את כל ימי-ההולדת (צוות + תלמידים) עם שם, תאריך לידה וסוג. */
export async function getBirthdays() {
  const [staff, students] = await Promise.all([
    getStaff().catch(() => []),
    getStudents().catch(() => []),
  ]);

  const staffBirthdays = (staff || [])
    .filter((m) => m.birthDate)
    .map((m) => ({
      name: (m.fullName || "").trim(),
      birthDate: m.birthDate,
      type: "staff",
    }));

  const studentBirthdays = (students || [])
    .filter((s) => s.birthDate)
    .map((s) => ({
      name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      birthDate: s.birthDate,
      type: "student",
    }));

  return [...staffBirthdays, ...studentBirthdays].filter((b) => b.name);
}

/*
  ממפה ימי-הולדת ליום-בחודש עבור חודש מסוים — לפי חודש הלידה בלבד (היום
  ההולדת חוזר כל שנה). מחזיר Map: מספר-יום → [{ name, type }].
*/
export function birthdaysByDayForMonth(birthdays, monthIndex) {
  const map = new Map();
  for (const b of birthdays || []) {
    const date = new Date(b.birthDate);
    if (Number.isNaN(date.getTime()) || date.getMonth() !== monthIndex) {
      continue;
    }
    const day = date.getDate();
    map.set(day, [...(map.get(day) || []), { name: b.name, type: b.type }]);
  }
  return map;
}
