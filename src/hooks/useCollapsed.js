import { useState } from "react";

/*
  useCollapsed — מצב קיפול (פתוח/סגור) של מקטע, נזכר במכשיר (localStorage) לפי
  מפתח. ברירת המחדל נפתחת; אחרי שהמשתמשת מקפלת פעם אחת, המקטע נשאר מקופל גם
  אחרי רענון — כך אפשר "להעלים" מקטעים ארוכים ולהגיע מהר למה שמתחתם.
*/
export default function useCollapsed(storageKey, defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem(storageKey);
      return v === null ? defaultCollapsed : v === "1";
    } catch {
      return defaultCollapsed;
    }
  });
  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* אחסון חסום — ייקפל לפגישה הנוכחית בלבד */
      }
      return next;
    });
  return [collapsed, toggle];
}
