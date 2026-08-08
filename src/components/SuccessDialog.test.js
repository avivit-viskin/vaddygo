import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SuccessDialog from "./SuccessDialog";

test("לא מוצג כשהוא סגור", () => {
  render(<SuccessDialog isOpen={false} onClose={() => {}} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("מציג את הודעת ההצלחה וכפתור סגירה שמדווח החוצה", () => {
  const onClose = jest.fn();
  render(<SuccessDialog isOpen onClose={onClose} message="השינויים נשמרו ✓" />);

  expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "נשמר בהצלחה");
  expect(screen.getByText("השינויים נשמרו ✓")).toBeInTheDocument();

  userEvent.click(screen.getByRole("button", { name: "הבנתי" }));
  expect(onClose).toHaveBeenCalled();
});
