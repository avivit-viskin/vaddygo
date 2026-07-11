import { api } from "./api";
import { getOnboarding } from "./onboardingService";

/*
  paymentSettingsService — קישורי התשלום של הוועד (ביט + קבוצת פייבוקס).
  נשמרים בשרת ברמת הגן כדי שכל חברות הוועד (2-3 לגן) יראו את אותם קישורים.
  אם אין גן מסונכרן או שהשרת לא זמין — נופלים לשמירה מקומית בדפדפן (מטמון),
  כך שהתכונה עובדת גם לפני התחברות/פריסה.
*/
const STORAGE_KEY = "vaadygo.paymentLinks";

function readLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { bit: saved?.bit || "", paybox: saved?.paybox || "" };
  } catch {
    return { bit: "", paybox: "" };
  }
}

function writeLocal(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

function currentGroupId() {
  try {
    return getOnboarding()?.groupId;
  } catch {
    return undefined;
  }
}

export async function getPaymentLinks() {
  const groupId = currentGroupId();
  if (groupId) {
    try {
      const group = await api.get(`/api/groups/${groupId}`);
      const links = { bit: group.bitLink || "", paybox: group.payboxLink || "" };
      writeLocal(links); // מטמון מקומי לשימוש כשאין רשת
      return links;
    } catch {
      // השרת לא זמין — נשתמש במטמון המקומי
    }
  }
  return readLocal();
}

export async function savePaymentLinks({ bit, paybox }) {
  const links = { bit: (bit || "").trim(), paybox: (paybox || "").trim() };
  writeLocal(links);
  const groupId = currentGroupId();
  if (groupId) {
    try {
      await api.put(`/api/groups/${groupId}/payment-links`, {
        bitLink: links.bit,
        payboxLink: links.paybox,
      });
    } catch {
      // נשמר מקומית; יסונכרן לשרת בפעם הבאה שיהיה זמין
    }
  }
  return links;
}
