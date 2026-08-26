import { useState } from "react";
import ShareLinkModal from "./ShareLinkModal";

/*
  ShareInvite — קישור-טקסט "שיתוף" שפותח את חלון השיתוף (ShareLinkModal).
  עוטף את מצב הפתיחה + החלון, כדי שאפשר לשבץ שיתוף בכל מסך בשורה אחת, בלי
  לחזור על ה-state וה-Modal בכל עמוד.
*/
function ShareInvite({
  url,
  title,
  message,
  prompt = "מכירים ועד שיכול להיעזר?",
  label = "שיתוף הקישור",
  className = "auth-page__hint",
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className={className}>
        {prompt}{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            color: "var(--color-primary-dark)",
            fontWeight: 700,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      </p>
      <ShareLinkModal
        isOpen={open}
        onClose={() => setOpen(false)}
        url={url}
        title={title}
        message={message}
      />
    </>
  );
}

export default ShareInvite;
