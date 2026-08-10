import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProTestControl from "./ProTestControl";
import { isPro } from "../../services/plan";
import { getActiveInstitution } from "../../services/institutionsService";
import { isSuperAdmin } from "../../services/authService";
import { setGroupPro } from "../../services/groupsService";
import { syncInstitutionsFromServer } from "../../services/onboardingService";

jest.mock("../../services/institutionsService", () => ({
  getActiveInstitution: jest.fn(),
}));
jest.mock("../../services/authService", () => ({
  isSuperAdmin: jest.fn(() => true),
}));
jest.mock("../../services/groupsService", () => ({
  setGroupPro: jest.fn(() => Promise.resolve({})),
}));
jest.mock("../../services/onboardingService", () => ({
  syncInstitutionsFromServer: jest.fn(() => Promise.resolve()),
}));

/*
  מאז אכיפת הפרו בשרת, הדבר הקריטי הוא שהמתג באמת כותב לשרת (ולא רק לדפדפן),
  ושהוא פועל על המוסד הפעיל בלבד.
*/
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  isSuperAdmin.mockReturnValue(true);
  getActiveInstitution.mockReturnValue({
    id: "inst-1",
    serverGroupId: 7,
    name: "רעות בדיקת הרשאות",
    isPro: false,
  });
});

test("מי שאינה מנהלת לא רואה את המתג בכלל", () => {
  isSuperAdmin.mockReturnValue(false);
  const { container } = render(<ProTestControl />);
  expect(container).toBeEmptyDOMElement();
});

test("מציג את שם המוסד הפעיל ואת מצבו", () => {
  render(<ProTestControl />);

  expect(screen.getAllByText("רעות בדיקת הרשאות").length).toBeGreaterThan(0);
  expect(screen.getByText("פרו נעול")).toBeInTheDocument();
});

test("פתיחה נשמרת בשרת למוסד הנכון ומרעננת את המוסדות", async () => {
  render(<ProTestControl />);

  userEvent.click(screen.getByRole("button", { name: /פתיחת פרו/ }));

  await waitFor(() => expect(setGroupPro).toHaveBeenCalledWith(7, true));
  expect(syncInstitutionsFromServer).toHaveBeenCalled();
  expect(await screen.findByText("פרו פתוח")).toBeInTheDocument();
});

test("סגירה שולחת false לשרת", async () => {
  getActiveInstitution.mockReturnValue({
    id: "inst-1",
    serverGroupId: 7,
    name: "רעות בדיקת הרשאות",
    isPro: true,
  });
  render(<ProTestControl />);

  userEvent.click(screen.getByRole("button", { name: /סגירת פרו/ }));

  await waitFor(() => expect(setGroupPro).toHaveBeenCalledWith(7, false));
});

test("כשל מהשרת מוצג ולא משנה את המצב", async () => {
  setGroupPro.mockRejectedValue(new Error("אין הרשאה"));
  render(<ProTestControl />);

  userEvent.click(screen.getByRole("button", { name: /פתיחת פרו/ }));

  expect(await screen.findByText("אין הרשאה")).toBeInTheDocument();
  expect(screen.getByText("פרו נעול")).toBeInTheDocument();
});

test("מוסד שאינו מסונכרן לשרת נשמר מקומית בלבד", async () => {
  getActiveInstitution.mockReturnValue({
    id: "inst-local",
    serverGroupId: null,
    name: "מוסד מקומי",
    isPro: false,
  });
  render(<ProTestControl />);

  userEvent.click(screen.getByRole("button", { name: /פתיחת פרו/ }));

  await waitFor(() => expect(screen.getByText("פרו פתוח")).toBeInTheDocument());
  expect(setGroupPro).not.toHaveBeenCalled();
  expect(isPro()).toBe(true);
});
