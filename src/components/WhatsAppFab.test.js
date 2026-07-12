import { render, screen } from "@testing-library/react";
import WhatsAppFab from "./WhatsAppFab";

test("כפתור וואטסאפ צף מקשר ל-wa.me עם הודעה מוכנה", () => {
  render(<WhatsAppFab />);
  const link = screen.getByRole("link", { name: "צור קשר בוואטסאפ" });
  expect(link.getAttribute("href")).toContain("wa.me/972");
  expect(link.getAttribute("href")).toContain("text=");
});
