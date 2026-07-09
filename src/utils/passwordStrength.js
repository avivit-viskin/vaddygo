/*
  passwordStrength — הערכת חוזק סיסמה והצעת סיסמה חזקה.
  משמש את מסך ההרשמה (מד חוזק + כפתור "הצע סיסמה חזקה").
  ההערכה מבוססת על אורך ומגוון סוגי תווים — לא על רשימות סיסמאות שנפרצו
  (על זה הדפדפן מתריע בעצמו).
*/

// בוחר מספר אקראי בטוח בטווח [0, max) — עדיף על Math.random לסיסמאות
function randomInt(max) {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function evaluatePassword(password) {
  if (!password) {
    return { score: 0, label: "", level: "none" };
  }

  let classes = 0;
  if (/[a-z]/.test(password)) classes++;
  if (/[A-Z]/.test(password)) classes++;
  if (/\d/.test(password)) classes++;
  if (/[^A-Za-z0-9]/.test(password)) classes++;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (classes >= 2) score++;
  if (classes >= 3) score++;
  if (classes >= 4 || password.length >= 14) score++;
  score = Math.min(score, 4);

  // סיסמה מסוג תווים אחד בלבד (למשל רק ספרות כמו 123456) — תמיד חלשה
  if (classes <= 1) score = Math.min(score, 1);

  const levels = {
    1: { label: "חלשה", level: "weak" },
    2: { label: "בינונית", level: "medium" },
    3: { label: "חזקה", level: "strong" },
    4: { label: "חזקה מאוד", level: "very-strong" },
  };
  return { score, ...(levels[score] || levels[1]) };
}

export function generateStrongPassword() {
  // בלי תווים מבלבלים (0/O, 1/l/I) כדי שקל יהיה להעתיק ולהקליד
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%*?";
  const all = lower + upper + digits + symbols;
  const pick = (set) => set[randomInt(set.length)];

  // מבטיחים לפחות תו אחד מכל סוג, ואז ממלאים ל-14 תווים
  const chars = [pick(lower), pick(upper), pick(digits), pick(symbols)];
  while (chars.length < 14) {
    chars.push(pick(all));
  }

  // ערבוב כדי שהתווים המובטחים לא יהיו תמיד בהתחלה
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
