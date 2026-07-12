import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupsStep from "./GroupsStep";

/*
  GroupsStep — בבית ספר, אופציית "אחר" מאפשרת להקליד כיתה ידנית
  (למנהלי ועד גם מעל כיתה ו').
*/
function Harness(initial) {
  const [data, setData] = useState({
    hasGroups: true,
    institutionType: "school",
    groups: [],
    ...initial,
  });
  return (
    <GroupsStep data={data} onChange={(patch) => setData((d) => ({ ...d, ...patch }))} />
  );
}

test("בית ספר: 'אחר' פותח שדה להוספת כיתה ידנית, והכיתה נוספת כצ'יפ", async () => {
  render(<Harness />);

  await userEvent.click(screen.getByRole("button", { name: "אחר" }));
  const input = screen.getByLabelText("הוספת כיתה ידנית");
  await userEvent.type(input, "מכינה");
  await userEvent.click(screen.getByRole("button", { name: "הוספה" }));

  expect(screen.getByRole("button", { name: "מכינה" })).toBeInTheDocument();
});

test("בגן אין אופציית 'אחר'", () => {
  render(<Harness institutionType="gan" />);
  expect(screen.queryByRole("button", { name: "אחר" })).not.toBeInTheDocument();
});
