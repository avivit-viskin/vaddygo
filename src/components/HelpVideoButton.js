import { useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import { toEmbed, hasHelpVideo, HELP_VIDEO_TITLE } from "../config/video";
import "../styles/help-video.css";

/*
  HelpVideoButton — כפתור שפותח את סרטון ההסבר של המערכת.

  הרקע: בנתוני השימוש נראה שהרבה ועדים נעצרים **לפני שהזינו תלמידים** — הם
  נרשמו, פתחו גן, ואז נתקעו. סיור החלוניות הקיים עוזר למי שמוכן לקרוא; סרטון
  עוזר למי שמעדיף לראות. לכן הכפתור מופיע בדיוק במקומות שבהם אנשים נתקעים.

  שלוש החלטות:

  1. **בלי כתובת — אין כפתור.** `hasHelpVideo()` מחזיר false כשלא הוגדר סרטון,
     והרכיב מחזיר null. עדיף שלא יהיה כפתור מאשר כפתור שפותח חלון ריק.

  2. **הסרטון נטען רק בלחיצה.** ה-iframe אינו קיים בעמוד עד שנפתח החלון, ולכן
     אין בקשה ליוטיוב — ואין עוגיות — לוועד שלא ביקש לצפות.

  3. **יחס 16:9 קבוע מראש.** גובה הנגן נקבע בעיצוב ולא ע"י הסרטון, אחרת החלון
     היה קופץ בגובה ברגע שהנגן נטען.
*/
function HelpVideoButton({
  label = "צפו בסרטון קצר",
  variant = "link",
  onOpen,
}) {
  const [open, setOpen] = useState(false);
  const embed = toEmbed();

  if (!hasHelpVideo()) {
    return null;
  }

  function openVideo() {
    setOpen(true);
    if (typeof onOpen === "function") {
      onOpen();
    }
  }

  return (
    <>
      <button
        type="button"
        className={
          variant === "button" ? "help-video__cta" : "help-video__link"
        }
        onClick={openVideo}
      >
        <Icon name="eye" size={16} /> {label}
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={HELP_VIDEO_TITLE}
      >
        <div className="help-video__frame">
          {embed.kind === "iframe" ? (
            <iframe
              src={embed.src}
              title={HELP_VIDEO_TITLE}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video src={embed.src} controls playsInline />
          )}
        </div>
      </Modal>
    </>
  );
}

export default HelpVideoButton;
