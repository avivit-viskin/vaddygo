import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToastContainer from "./Toast";
import { toastSuccess, toastError } from "../services/toastBus";

/*
  טסטים ל-ToastContainer: הצגת הודעה, איחוד כפילויות זהות, וסגירה ידנית.
*/
test("מציג הודעת הצלחה, ומאחד הודעה זהה שנשלחת שוב", () => {
  render(<ToastContainer />);
  act(() => toastSuccess("השינויים נשמרו"));
  expect(screen.getByText("השינויים נשמרו")).toBeInTheDocument();
  // הודעה זהה (למשל ממחיקה גורפת) מתאחדת — נשארת הופעה אחת
  act(() => toastSuccess("השינויים נשמרו"));
  expect(screen.getAllByText("השינויים נשמרו")).toHaveLength(1);
});

test("סגירה ידנית מסירה את ההודעה", async () => {
  render(<ToastContainer />);
  act(() => toastError("אירעה שגיאה"));
  expect(screen.getByText("אירעה שגיאה")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "סגירת ההודעה" }));
  expect(screen.queryByText("אירעה שגיאה")).not.toBeInTheDocument();
});
