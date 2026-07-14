import { render, screen, fireEvent } from "@testing-library/react";
import CopyMessageButton from "./CopyMessageButton";

test("מעתיק את הטקסט ללוח ומציג אישור", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });

  render(<CopyMessageButton text="הודעת בדיקה לכל ההורים" />);
  fireEvent.click(screen.getByRole("button", { name: /העתקת ההודעה/ }));

  expect(writeText).toHaveBeenCalledWith("הודעת בדיקה לכל ההורים");
  expect(
    await screen.findByRole("button", { name: /הועתק/ })
  ).toBeInTheDocument();
});
