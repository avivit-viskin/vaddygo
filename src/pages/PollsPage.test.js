import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PollsPage from "./PollsPage";

afterEach(() => localStorage.clear());

test("יוצר סקר עם שתי אפשרויות ומציג אותו עם תוצאות", () => {
  render(
    <MemoryRouter>
      <PollsPage />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText("שאלת הסקר"), {
    target: { value: "איזו מתנה לגננת?" },
  });
  fireEvent.change(screen.getByLabelText("אפשרות 1"), {
    target: { value: "פרחים" },
  });
  fireEvent.change(screen.getByLabelText("אפשרות 2"), {
    target: { value: "שובר" },
  });
  fireEvent.click(screen.getByRole("button", { name: "יצירת סקר" }));

  expect(screen.getByText("איזו מתנה לגננת?")).toBeInTheDocument();
  expect(screen.getByText("פרחים")).toBeInTheDocument();

  // הוספת קול לאפשרות הראשונה מעלה את הספירה
  fireEvent.click(screen.getByRole("button", { name: /הוספת קול לפרחים/ }));
  expect(screen.getByText(/סה״כ 1 קולות/)).toBeInTheDocument();
});
