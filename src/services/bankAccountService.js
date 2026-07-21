import { api } from "./api";
import { getOnboarding } from "./onboardingService";

/*
  bankAccountService — חשבון הבנק של הוועד לקבלת תשלומי אשראי (מודל "חשבונות
  מחוברים"). כל ועד מזין את פרטי חשבון הבנק שלו — בלי מפתחות ובלי קוד — והכסף
  מהסליקה מגיע ישירות לחשבון הזה. נשמר בשרת ברמת הגן; אם השרת עוד לא זמין,
  נשמר מקומית ויסונכרן. אלה פרטי החשבון של הוועד עצמו (לא מפתח סודי).
*/
const STORAGE_KEY = "vaadygo.bankAccount";

function readLocal() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      holder: s?.holder || "",
      bank: s?.bank || "",
      branch: s?.branch || "",
      account: s?.account || "",
    };
  } catch {
    return { holder: "", bank: "", branch: "", account: "" };
  }
}

function writeLocal(v) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}

function currentGroupId() {
  try {
    return getOnboarding()?.groupId;
  } catch {
    return undefined;
  }
}

export async function getBankAccount() {
  const groupId = currentGroupId();
  if (groupId) {
    try {
      const g = await api.get(`/api/groups/${groupId}`);
      // השרת עשוי עדיין לא לכלול את השדות — אם כן, הוא מקור האמת.
      if (g && g.bankHolder !== undefined) {
        const v = {
          holder: g.bankHolder || "",
          bank: g.bankName || "",
          branch: g.bankBranch || "",
          account: g.bankAccount || "",
        };
        writeLocal(v);
        return v;
      }
    } catch {
      // השרת לא זמין — נשתמש במטמון המקומי
    }
  }
  return readLocal();
}

export async function saveBankAccount({ holder, bank, branch, account }) {
  const v = {
    holder: (holder || "").trim(),
    bank: (bank || "").trim(),
    branch: (branch || "").trim(),
    account: (account || "").trim(),
  };
  writeLocal(v);
  const groupId = currentGroupId();
  if (groupId) {
    try {
      await api.put(`/api/groups/${groupId}/bank-account`, {
        holder: v.holder,
        bankName: v.bank,
        branch: v.branch,
        account: v.account,
      });
    } catch {
      // השרת לא זמין/עוד לא תומך — נשאר מקומי ויסונכרן בפעם הבאה
    }
  }
  return v;
}
