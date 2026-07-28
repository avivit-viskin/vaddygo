/*
  supplierSession — זיכרון כניסה קצר לאזור הספק. ברגע שהספק מתחבר (מייל+סיסמה)
  בעמוד העריכה, שומרים סשן קצר במכשיר. אם הספק יוצא וחוזר תוך כמה דקות — לא
  צריך להתחבר שוב; אחרי שהתוקף פג, יתבקש שוב שם משתמש וסיסמה. הסשן צמוד לטוקן.
*/
const KEY = "vaadygo.supplierSession";
// כמה זמן זוכרים כניסה של ספק (קצר בכוונה — "לכמה דקות")
const TTL_MS = 30 * 60 * 1000; // 30 דקות

export function setSupplierSession(token) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ token, at: Date.now() }));
  } catch {
    // אחסון חסום — הסשן פשוט לא ייזכר; לא קריטי
  }
}

export function hasValidSupplierSession(token) {
  try {
    const session = JSON.parse(localStorage.getItem(KEY));
    return Boolean(
      session &&
        session.token === token &&
        Date.now() - session.at < TTL_MS
    );
  } catch {
    return false;
  }
}

export function clearSupplierSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
