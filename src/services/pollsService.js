/*
  pollsService — סקרים והצבעות (פיצ'ר פרו), גרסת לקוח (localStorage).
  הוועד יוצר סקר, משתף אותו להורים בוואטסאפ, וסופר את התשובות בלחיצה (+1 לכל
  אפשרות) — עם תצוגת תוצאות חיה. הצבעה ישירה של הורים דרך קישור ציבורי (ספירה
  אוטומטית) היא שדרוג עתידי שדורש שרת.
*/
const KEY = "vaadygo.polls"; // [{ id, question, options: [{ text, votes }], createdAt }]

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

export function getPolls() {
  return read();
}

/* יוצר סקר חדש; מתעלם מאפשרויות ריקות, דורש שאלה ולפחות 2 אפשרויות. */
export function createPoll(question, optionTexts) {
  const q = (question || "").trim();
  const options = (optionTexts || [])
    .map((t) => (t || "").trim())
    .filter(Boolean)
    .map((text) => ({ text, votes: 0 }));
  if (!q || options.length < 2) {
    throw new Error("צריך שאלה ולפחות שתי אפשרויות");
  }
  const poll = { id: newId(), question: q, options, createdAt: new Date().toISOString() };
  const polls = read();
  polls.unshift(poll);
  write(polls);
  return poll;
}

export function addVote(pollId, optionIndex) {
  const polls = read();
  const poll = polls.find((p) => p.id === pollId);
  if (poll && poll.options[optionIndex]) {
    poll.options[optionIndex].votes += 1;
    write(polls);
  }
  return poll;
}

export function removeVote(pollId, optionIndex) {
  const polls = read();
  const poll = polls.find((p) => p.id === pollId);
  if (poll && poll.options[optionIndex] && poll.options[optionIndex].votes > 0) {
    poll.options[optionIndex].votes -= 1;
    write(polls);
  }
  return poll;
}

export function deletePoll(pollId) {
  write(read().filter((p) => p.id !== pollId));
}

/* סה"כ קולות בסקר */
export function totalVotes(poll) {
  return (poll.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
}

/* טקסט מוכן לשיתוף בוואטסאפ — שאלה + אפשרויות ממוספרות */
export function pollShareText(poll) {
  const lines = [`🗳️ ${poll.question}`, ""];
  poll.options.forEach((o, i) => lines.push(`${i + 1}. ${o.text}`));
  lines.push("", "השיבו עם מספר האפשרות 🙏");
  return lines.join("\n");
}
