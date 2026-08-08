import { api } from "./api";

/*
  pollsService — סקרים והצבעות.

  מקור האמת הוא השרת: הוועד יוצר סקר ומקבל **קישור ציבורי**, ההורים עונים
  בתוך הקישור, והתוצאות מתעדכנות אצל הוועד אוטומטית.

  נשמרה נפילה מקומית (localStorage) לסקרים שנוצרו כשהשרת לא היה זמין — כמו
  בשאר השירותים בפרויקט. לסקר מקומי אין קישור ציבורי (אי אפשר להצביע דרך
  הרשת בלי שרת), ולכן הספירה בו נשארת ידנית עד שהשרת חוזר.
*/
const KEY = "vaadygo.polls"; // סקרים מקומיים בלבד (fallback)
const VOTER_KEY = "vaadygo.voterKey"; // מזהה מצביע אקראי, נשמר אצל ההורה

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function write(polls) {
  try {
    localStorage.setItem(KEY, JSON.stringify(polls));
  } catch {
    // אחסון חסום — לא קריטי
  }
}

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/*
  voterKey — מזהה אקראי של הדפדפן שממנו מצביעים. אינו פרט מזהה ואינו מקושר
  לאף אדם; תפקידו היחיד למנוע הצבעה כפולה בטעות (רענון / לחיצה חוזרת).
*/
export function voterKey() {
  try {
    let key = localStorage.getItem(VOTER_KEY);
    if (!key) {
      key = newId() + newId();
      localStorage.setItem(VOTER_KEY, key);
    }
    return key;
  } catch {
    // אחסון חסום — מזהה חד-פעמי לסשן הנוכחי
    return newId() + newId();
  }
}

/* מנרמל סקר מקומי למבנה שהשרת מחזיר, כדי שהמסך לא יכיר שני מבנים. */
function normalizeLocal(poll) {
  return {
    ...poll,
    isLocal: true,
    publicToken: "",
    totalVotes: totalVotes(poll),
    options: (poll.options || []).map((o, i) => ({
      id: o.id ?? i,
      text: o.text,
      votes: o.votes || 0,
    })),
  };
}

export async function getPolls() {
  try {
    const serverPolls = await api.get("/api/polls");
    // סקרים מקומיים שנוצרו בזמן נתק מוצגים לצדם, מסומנים כמקומיים
    return [...serverPolls, ...read().map(normalizeLocal)];
  } catch {
    return read().map(normalizeLocal);
  }
}

/* יוצר סקר חדש; מתעלם מאפשרויות ריקות, דורש שאלה ולפחות 2 אפשרויות. */
export async function createPoll(question, optionTexts) {
  const q = (question || "").trim();
  const texts = (optionTexts || []).map((t) => (t || "").trim()).filter(Boolean);
  if (!q || texts.length < 2) {
    throw new Error("צריך שאלה ולפחות שתי אפשרויות");
  }

  try {
    return await api.post("/api/polls", { question: q, options: texts });
  } catch {
    // השרת לא זמין — שומרים מקומית כדי לא לאבד את הסקר
    const poll = {
      id: newId(),
      question: q,
      options: texts.map((text) => ({ text, votes: 0 })),
      createdAt: new Date().toISOString(),
    };
    const polls = read();
    polls.unshift(poll);
    write(polls);
    return normalizeLocal(poll);
  }
}

/* סגירה/פתיחה של סקר לתשובות נוספות (סקר שרת בלבד). */
export async function setPollClosed(pollId, isClosed) {
  return api.put(`/api/polls/${pollId}/closed`, { isClosed });
}

export async function deletePoll(pollId, isLocal = false) {
  if (isLocal) {
    write(read().filter((p) => String(p.id) !== String(pollId)));
    return;
  }
  await api.del(`/api/polls/${pollId}`);
}

/* ספירה ידנית — נשארת רק לסקרים מקומיים (בלי שרת אין הצבעה אמיתית). */
export function addVote(pollId, optionIndex) {
  const polls = read();
  const poll = polls.find((p) => String(p.id) === String(pollId));
  if (poll && poll.options[optionIndex]) {
    poll.options[optionIndex].votes += 1;
    write(polls);
  }
  return poll;
}

export function removeVote(pollId, optionIndex) {
  const polls = read();
  const poll = polls.find((p) => String(p.id) === String(pollId));
  if (poll && poll.options[optionIndex] && poll.options[optionIndex].votes > 0) {
    poll.options[optionIndex].votes -= 1;
    write(polls);
  }
  return poll;
}

/* ── הצד הציבורי: מה שההורה רואה ועושה בקישור ── */

export async function getPublicPoll(token) {
  return api.get(`/api/public/polls/${token}`);
}

export async function votePublicPoll(token, optionId) {
  return api.post(`/api/public/polls/${token}/vote`, {
    optionId,
    voterKey: voterKey(),
  });
}

/* סה"כ קולות בסקר */
export function totalVotes(poll) {
  return (poll?.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
}

/* כתובת הסקר הציבורית לשיתוף עם ההורים */
export function pollPublicUrl(poll) {
  if (!poll?.publicToken) {
    return "";
  }
  return `${window.location.origin}/poll/${poll.publicToken}`;
}

/*
  pollShareText — ההודעה שנשלחת להורים. כשיש קישור ציבורי מזמינים ללחוץ ולענות
  (התוצאות נספרות אוטומטית); בסקר מקומי, בלי קישור, חוזרים לנוסח הישן שמבקש
  לענות עם מספר — כדי לא להבטיח קישור שאינו קיים.
*/
export function pollShareText(poll) {
  const url = pollPublicUrl(poll);
  if (url) {
    return [`🗳️ ${poll.question}`, "", "אפשר לענות כאן:", url].join("\n");
  }
  const lines = [`🗳️ ${poll.question}`, ""];
  (poll.options || []).forEach((o, i) => lines.push(`${i + 1}. ${o.text}`));
  lines.push("", "השיבו עם מספר האפשרות 🙏");
  return lines.join("\n");
}
