import { useEffect, useRef, useState } from "react";
import { getUser } from "../services/authService";
import "../styles/institutionAvatar.css";

/*
  InstitutionAvatar — עיגול קטן בכותרת עם ראשי התיבות של שם הגן
  (המילה הראשונה + השנייה, למשל "גן כוכב" → "גכ"). לחיצה פותחת פופאפ קטן
  עם שם הגן המלא ומייל ההתחברות.
*/
function ganInitials(name) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

function InstitutionAvatar({ name }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const email = getUser()?.email;

  // סגירה בלחיצה מחוץ לפופאפ
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function handleOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div className="inst-avatar" ref={ref}>
      <button
        type="button"
        className="inst-avatar__circle"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`פרטי ${name}`}
        aria-expanded={open}
      >
        {ganInitials(name)}
      </button>
      {open && (
        <div className="inst-avatar__popup" role="dialog" aria-label="פרטי הגן">
          <strong className="inst-avatar__name">{name}</strong>
          {email && <span className="inst-avatar__email">{email}</span>}
        </div>
      )}
    </div>
  );
}

export default InstitutionAvatar;
