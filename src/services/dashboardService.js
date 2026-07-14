import { api } from "./api";
import { getOnboarding } from "./onboardingService";
import { getStaff, nextBirthday } from "./staffService";
import { currentSchoolYear } from "./schoolYear";
import { formatDayMonth } from "./format";

/*
  dashboardService — נתוני מסך הבית (UI_SPEC ס' 8).
  קודם מנסים את השרת — החישוב האמיתי נעשה שם (DashboardService);
  אם אינו זמין (עוד לא פרוס לאוויר) בונים סיכום מקומי מנתוני האשף
  שנשמרו בדפדפן, באותו מבנה בדיוק, כדי שמסך הבית יחיה כבר עכשיו.
  מחזיר null כשאין נתונים בכלל (עוד לא הושלם אשף ההרשמה).
*/

/* כמה ימים קדימה נחשב "יום הולדת קרוב" — זהה לכללי השרת */
const BIRTHDAY_WINDOW_DAYS = 30;
const BIRTHDAY_ALERT_DAYS = 7;

export async function loadDashboard() {
  try {
    const data = await api.get("/api/dashboard");
    return { ...data, fromServer: true };
  } catch {
    return buildLocalDashboard();
  }
}

async function buildLocalDashboard() {
  const onboarding = getOnboarding();
  if (!onboarding) {
    return null;
  }

  const children = Number(onboarding.childrenCount) || 0;
  const byCategory = (onboarding.categories || [])
    .filter((c) => Number(c.amount) > 0)
    .map((c) => ({
      name: c.name.replace(" (אופציונלי)", ""),
      targetAmount: Number(c.amount) * children,
      collectedAmount: 0,
      spentAmount: 0,
    }));
  const target = byCategory.reduce((sum, c) => sum + c.targetAmount, 0);

  const staff = await getStaff();
  const upcomingBirthdays = buildUpcomingBirthdays(staff);

  return {
    ganName: onboarding.ganName,
    year: currentSchoolYear(),
    childrenCount: children,
    collectionTarget: target,
    collectedTotal: 0,
    openDebt: target,
    boxBalance: 0,
    progressPercent: 0,
    byPaymentMethod: [
      { method: "bit", amount: 0 },
      { method: "paybox", amount: 0 },
      { method: "cash", amount: 0 },
    ],
    byCategory,
    alerts: buildLocalAlerts(children, upcomingBirthdays),
    upcomingBirthdays,
    fromServer: false,
  };
}

function buildUpcomingBirthdays(staff, today = new Date()) {
  return staff
    .map((member) => ({
      staffMemberId: member.id,
      fullName: member.fullName,
      role: member.role,
      birthDate: member.birthDate,
      nextBirthday: nextBirthday(member.birthDate, today).toISOString(),
    }))
    .filter((b) => daysUntil(b.nextBirthday, today) <= BIRTHDAY_WINDOW_DAYS)
    .sort((a, b) => new Date(a.nextBirthday) - new Date(b.nextBirthday));
}

function buildLocalAlerts(childrenCount, upcomingBirthdays, today = new Date()) {
  const alerts = [];

  if (childrenCount > 0) {
    alerts.push({
      type: "payments",
      message: `הגבייה עוד לא התחילה — ${childrenCount} ילדים טרם שילמו`,
    });
  }

  for (const b of upcomingBirthdays) {
    const days = daysUntil(b.nextBirthday, today);
    if (days <= BIRTHDAY_ALERT_DAYS) {
      alerts.push({
        type: "birthday",
        message:
          days === 0
            ? `יום הולדת של ${b.fullName} היום! 🎂`
            : `יום הולדת של ${b.fullName} ב-${formatDayMonth(b.nextBirthday)}`,
      });
    }
  }

  return alerts;
}

function daysUntil(isoDate, today = new Date()) {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((new Date(isoDate) - startOfToday) / (1000 * 60 * 60 * 24));
}
