import { api } from "./api";
import { getOnboarding } from "./onboardingService";

/*
  clearingSettingsService — חשבון סליקת האשראי של הוועד (המפתחות של חשבון הספק
  שלו). נשמר בשרת ברמת הגן, כדי שכסף הגבייה יגיע ישירות לחשבון של אותו ועד.
  שלא כמו ביט/פייבוקס — המפתחות *סודיים*, ולכן אין שמירה מקומית: הכל נשמר בשרת
  בלבד, והשרת לעולם לא מחזיר את המפתחות (רק ספק, מזהה עמוד, ודגל "מחובר").
*/
function currentGroupId() {
  try {
    return getOnboarding()?.groupId;
  } catch {
    return undefined;
  }
}

export async function getClearing() {
  const groupId = currentGroupId();
  if (!groupId) {
    return { provider: "", pageUid: "", hasClearing: false };
  }
  const group = await api.get(`/api/groups/${groupId}`);
  return {
    provider: group.payProvider || "",
    pageUid: group.payPageUid || "",
    hasClearing: !!group.hasClearing,
  };
}

export async function saveClearing({ provider, apiKey, secretKey, pageUid }) {
  const groupId = currentGroupId();
  if (!groupId) {
    throw new Error("צריך קודם לסיים את הגדרת הגן (הרשמה) כדי לחבר סליקה.");
  }
  const group = await api.put(`/api/groups/${groupId}/payment-provider`, {
    provider: (provider || "").trim(),
    apiKey: (apiKey || "").trim(),
    secretKey: (secretKey || "").trim(),
    pageUid: (pageUid || "").trim(),
  });
  return {
    provider: group.payProvider || "",
    pageUid: group.payPageUid || "",
    hasClearing: !!group.hasClearing,
  };
}
