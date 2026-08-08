import {
  createPoll,
  getPolls,
  addVote,
  removeVote,
  deletePoll,
  totalVotes,
  pollShareText,
  pollPublicUrl,
  voterKey,
} from "./pollsService";
import { api } from "./api";

jest.mock("./api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    del: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

test("יצירת סקר דורשת שאלה ולפחות שתי אפשרויות — עוד לפני פנייה לשרת", async () => {
  await expect(createPoll("", ["א", "ב"])).rejects.toThrow();
  await expect(createPoll("שאלה?", ["רק אחת"])).rejects.toThrow();
  expect(api.post).not.toHaveBeenCalled();
});

test("סקר נשמר בשרת ומקבל קישור ציבורי", async () => {
  api.post.mockResolvedValue({
    id: 7,
    question: "איזו מתנה?",
    publicToken: "abc123",
    options: [
      { id: 1, text: "פרחים", votes: 0 },
      { id: 2, text: "שובר", votes: 0 },
    ],
    totalVotes: 0,
  });

  const poll = await createPoll("איזו מתנה?", ["פרחים", "שובר", ""]);

  // האפשרות הריקה סוננה לפני השליחה
  expect(api.post).toHaveBeenCalledWith("/api/polls", {
    question: "איזו מתנה?",
    options: ["פרחים", "שובר"],
  });
  expect(pollPublicUrl(poll)).toContain("/poll/abc123");
  // ההודעה להורים מזמינה ללחוץ על הקישור, לא לענות במספר
  expect(pollShareText(poll)).toContain("/poll/abc123");
  expect(pollShareText(poll)).not.toContain("1. פרחים");
});

test("כשהשרת לא זמין הסקר נשמר מקומית, בלי קישור ועם ספירה ידנית", async () => {
  api.post.mockRejectedValue(new Error("אין שרת"));
  api.get.mockRejectedValue(new Error("אין שרת"));

  const poll = await createPoll("איזו מתנה?", ["פרחים", "שובר"]);
  expect(poll.isLocal).toBe(true);
  expect(pollPublicUrl(poll)).toBe("");
  // בלי קישור — חוזרים לנוסח הממוספר, כדי לא להבטיח קישור שאינו קיים
  expect(pollShareText(poll)).toContain("1. פרחים");

  addVote(poll.id, 0);
  addVote(poll.id, 0);
  addVote(poll.id, 1);
  let saved = (await getPolls()).find((p) => p.id === poll.id);
  expect(saved.options[0].votes).toBe(2);
  expect(totalVotes(saved)).toBe(3);

  removeVote(poll.id, 1);
  removeVote(poll.id, 1); // כבר 0 — לא יורד מתחת
  saved = (await getPolls()).find((p) => p.id === poll.id);
  expect(saved.options[1].votes).toBe(0);

  await deletePoll(poll.id, true);
  expect(await getPolls()).toHaveLength(0);
  expect(api.del).not.toHaveBeenCalled();
});

test("סקרי השרת וסקרים מקומיים מוצגים יחד", async () => {
  api.post.mockRejectedValue(new Error("אין שרת"));
  await createPoll("מקומי?", ["כן", "לא"]);

  api.get.mockResolvedValue([
    { id: 1, question: "משרת?", publicToken: "t1", options: [], totalVotes: 0 },
  ]);

  const polls = await getPolls();
  expect(polls).toHaveLength(2);
  expect(polls[0].question).toBe("משרת?");
  expect(polls[0].isLocal).toBeUndefined();
  expect(polls[1].isLocal).toBe(true);
});

test("מזהה המצביע נשמר וחוזר זהה בפעם הבאה", () => {
  const first = voterKey();
  expect(first).toBeTruthy();
  expect(voterKey()).toBe(first);
});
