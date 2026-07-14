import { useState } from "react";
import Button from "./Button";

/*
  CopyMessageButton — מעתיק טקסט ללוח, כדי שאפשר יהיה להדביק אותו בקבוצת
  הוואטסאפ של ההורים ולשלוח הודעה אחת לכולם בבת אחת (וואטסאפ לא מאפשר לשלוח
  לכמה מספרים דרך קישור אחד). מציג אישור קצר אחרי ההעתקה.
*/
function CopyMessageButton({ text, label = "📋 העתקת ההודעה" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // נפילה לדפדפנים ישנים / הקשר לא מאובטח
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        // אין מה לעשות — נשאיר את המשתמשת להעתיק ידנית
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" onClick={copy}>
      {copied ? "✓ הועתק!" : label}
    </Button>
  );
}

export default CopyMessageButton;
