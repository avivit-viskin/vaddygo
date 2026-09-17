import { api } from "./api";

/*
  publicStatsService — מדדים ציבוריים לתצוגה (ללא הזדהות). כרגע: מספר הוועדים
  הרשומים, שמוצג בפורטל הספקים כתמריץ ("כבר X ועדים ב-VaddyGo").
*/
export async function getCommitteeCount() {
  const data = await api.get("/api/public/stats/committee-count");
  return Number(data?.count) || 0;
}
