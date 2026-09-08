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
    return {
      bit: saved?.bit || "",
      paybox: saved?.paybox || "",
      customLinks: Array.isArray(saved?.customLinks) ? saved.customLinks : [],
    };
  } catch {
    return { bit: "", paybox: "", customLinks: [] };
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
      const links = {
        bit: group.bitLink || "",
        paybox: group.payboxLink || "",
        customLinks: Array.isArray(group.customLinks) ? group.customLinks : [],
      };
      writeLocal(links); // מטמון מקומי לשימוש כשאין רשת
      return links;
    } catch {
      // השרת לא זמין — נשתמש במטמון המקומי
    }
  }
  return readLocal();
}

export async function savePaymentLinks({ bit, paybox, customLinks }) {
  // שומרים רק קישורים נוספים שיש בהם גם שם וגם כתובת
  const cleanCustom = (customLinks || [])
    .map((l) => ({ label: (l.label || "").trim(), url: (l.url || "").trim() }))
    .filter((l) => l.label && l.url);
  const links = {
    bit: (bit || "").trim(),
    paybox: (paybox || "").trim(),
    customLinks: cleanCustom,
  };
  const groupId = currentGroupId();
  if (!groupId) {
    // אין גן מסונכרן — נשמר מקומית בלבד
    writeLocal(links);
    return links;
  }
  try {
    const group = await api.put(`/api/groups/${groupId}/payment-links`, {
      bitLink: links.bit,
      payboxLink: links.paybox,
      customLinks: cleanCustom,
    });
    // מקור האמת הוא השרת — שומרים במטמון את מה שנשמר בפועל
    const saved = {
      bit: group.bitLink || "",
      paybox: group.payboxLink || "",
      customLinks: Array.isArray(group.customLinks) ? group.customLinks : [],
    };
    writeLocal(saved);
    return saved;
  } catch (err) {
    // שגיאת ולידציה (קלט לא תקין) — זורקים הלאה כדי שהמשתמשת תראה ותתקן
    if (err.status === 400) {
      throw err;
    }
    // השרת לא זמין — נשמר מקומית ויסונכרן בפעם הבאה
    writeLocal(links);
    return links;
  }
}
