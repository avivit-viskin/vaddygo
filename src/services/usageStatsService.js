import { api } from "./api";

/*
  usageStatsService — נתוני השימוש למנהלת VaddyGo (SuperAdmin בלבד).
  מקור יחיד: `GET /api/admin/usage`. אין כאן נפילה מקומית בכוונה — נתוני שימוש
  חייבים להיות אמיתיים מהשרת; מספר מומצא מהדפדפן יטעה בהחלטות עסקיות.
*/
export async function getUsageStats() {
  return api.get("/api/admin/usage");
}

/*
  funnelPercent — איזה אחוז מהנרשמים השלימו. 0 כשעוד לא נרשם אף אחד, כדי לא
  להציג NaN במסך.
*/
export function funnelPercent(funnel) {
  const registered = funnel?.registered || 0;
  if (registered === 0) {
    return 0;
  }
  return Math.round(((funnel.completed || 0) / registered) * 100);
}
