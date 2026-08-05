import {
  createPoll,
  getPolls,
  addVote,
  removeVote,
  deletePoll,
  totalVotes,
  pollShareText,
} from "./pollsService";

afterEach(() => localStorage.clear());

test("יצירת סקר דורשת שאלה ולפחות שתי אפשרויות", () => {
  expect(() => createPoll("", ["א", "ב"])).toThrow();
  expect(() => createPoll("שאלה?", ["רק אחת"])).toThrow();
  const poll = createPoll("איזו מתנה?", ["פרחים", "שובר", ""]);
  expect(poll.options).toHaveLength(2); // הריקה סוננה
  expect(getPolls()).toHaveLength(1);
});

test("ספירת קולות עולה ויורדת (לא מתחת ל-0)", () => {
  const poll = createPoll("איזו מתנה?", ["פרחים", "שובר"]);
  addVote(poll.id, 0);
  addVote(poll.id, 0);
  addVote(poll.id, 1);
  const after = getPolls().find((p) => p.id === poll.id);
  expect(after.options[0].votes).toBe(2);
  expect(totalVotes(after)).toBe(3);

  removeVote(poll.id, 1);
  removeVote(poll.id, 1); // כבר 0 — לא יורד מתחת
  expect(getPolls()[0].options[1].votes).toBe(0);
});

test("מחיקת סקר, וטקסט שיתוף ממוספר", () => {
  const poll = createPoll("איזו מתנה?", ["פרחים", "שובר"]);
  expect(pollShareText(poll)).toContain("1. פרחים");
  expect(pollShareText(poll)).toContain("2. שובר");
  deletePoll(poll.id);
  expect(getPolls()).toHaveLength(0);
});
