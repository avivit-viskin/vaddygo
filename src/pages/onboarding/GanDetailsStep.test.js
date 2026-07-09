import { render, screen, fireEvent } from "@testing-library/react";
import GanDetailsStep from "./GanDetailsStep";

/*
  טסט לשדה "שם הגן" — השלמה אוטומטית מהמאגר הרשמי (data.gov.il) לפי העיר.
  קריאת ה-API מדומה דרך global.fetch; הקלדה חופשית תמיד אפשרית.
*/
function mockRegistry(ganNames) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          result: { records: ganNames.map((name) => ({ "שם מוסד": name })) },
        }),
    })
  );
}

afterEach(() => {
  delete global.fetch;
});

test("שם הגן מציע גנים מהמאגר הרשמי לפי העיר, וניתן לבחור מההצעות", async () => {
  // "גן הפרחים" מופיע פעמיים (כמו במאגר, שורה לכל שנה) — אמור להופיע פעם אחת
  mockRegistry(["גן הפרחים", "גן הפרחים", "גן היסמין"]);
  const onChange = jest.fn();

  render(
    <GanDetailsStep
      data={{ city: "חיפה", ganName: "גן", childrenCount: "", staffCount: "" }}
      errors={{}}
      onChange={onChange}
    />
  );

  // פוקוס פותח את הרשימה; ההצעות מגיעות מהמאגר אחרי ה-debounce
  fireEvent.focus(screen.getByLabelText("שם הגן / בית הספר"));

  const suggestion = await screen.findByRole("button", { name: "גן היסמין" });
  fireEvent.mouseDown(suggestion);

  expect(onChange).toHaveBeenCalledWith({ ganName: "גן היסמין" });
  // אומת שנשלחה בקשה למאגר הרשמי
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("data.gov.il/api/3/action/datastore_search")
  );
});
