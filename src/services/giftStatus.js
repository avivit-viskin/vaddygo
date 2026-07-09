/*
  giftStatus — שלושת מצבי המתנה מהאפיון (UI_SPEC ס' 12): מתוכנן, בקנייה, בוצע.
  מרוכז במקום אחד כדי שהתוויות והצבעים יהיו אחידים בכל המסך.
*/
export const GIFT_STATUSES = [
  { value: "planned", label: "מתוכנן" },
  { value: "buying", label: "בקנייה" },
  { value: "done", label: "בוצע" },
];

export function giftStatusLabel(value) {
  return GIFT_STATUSES.find((status) => status.value === value)?.label || value;
}
