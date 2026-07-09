/*
  paymentSettingsService — קישורי התשלום הקבועים של הוועד (ביט + קבוצת פייבוקס).
  המשתמשת מדביקה אותם פעם אחת; בקשות התשלום משתמשות בהם.

  ⏳ נשמר בדפדפן (localStorage). כשיתווסף לשרת מקום לפרטי הגן (מודל Group),
  הקישורים יעברו לשם כדי שכל חברות הוועד יראו אותם — בלי לשנות את המסכים.
*/
const STORAGE_KEY = "vaadygo.paymentLinks";

export function getPaymentLinks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { bit: saved?.bit || "", paybox: saved?.paybox || "" };
  } catch {
    return { bit: "", paybox: "" };
  }
}

export function savePaymentLinks({ bit, paybox }) {
  const links = { bit: (bit || "").trim(), paybox: (paybox || "").trim() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  return links;
}
