import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getA11ySettings, saveA11ySettings } from "../services/accessibility";
import "../styles/accessibility.css";

/*
  AccessibilityWidget — סמל הנגישות הצף ופאנל ההגדרות (ת"י 5568): הגדלת/הקטנת
  טקסט, ניגודיות גבוהה (רקע שחור), הדגשת קישורים, גופן קריא, איפוס, וקישור
  להצהרת הנגישות. ההגדרות נשמרות ומוחלות על כל האתר.
*/
function AccessibilityIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="4.2" r="2.1" fill="currentColor" />
      <path
        d="M12 7v4.6M5.4 8.3h13.2M8.8 18l3.2-6 3.2 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(getA11ySettings);

  function update(next) {
    setSettings(saveA11ySettings({ ...settings, ...next }));
  }

  function changeFont(delta) {
    update({ font: Math.max(0, Math.min(3, settings.font + delta)) });
  }

  function reset() {
    setSettings(
      saveA11ySettings({ font: 0, contrast: false, links: false, readable: false })
    );
  }

  // Escape סוגר את הפאנל
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="a11y-fab"
        aria-label="תפריט נגישות"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <AccessibilityIcon />
      </button>

      {open && (
        <div className="a11y-panel" role="dialog" aria-label="הגדרות נגישות">
          <div className="a11y-panel__head">
            <strong>נגישות</strong>
            <button
              type="button"
              className="a11y-panel__close"
              aria-label="סגירת תפריט הנגישות"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="a11y-row">
            <span>גודל טקסט</span>
            <div className="a11y-fontctl">
              <button
                type="button"
                aria-label="הקטנת טקסט"
                onClick={() => changeFont(-1)}
                disabled={settings.font === 0}
              >
                A−
              </button>
              <span className="a11y-level" aria-hidden="true">
                {settings.font}
              </span>
              <button
                type="button"
                aria-label="הגדלת טקסט"
                onClick={() => changeFont(1)}
                disabled={settings.font === 3}
              >
                A+
              </button>
            </div>
          </div>

          <button
            type="button"
            className={`a11y-toggle${settings.contrast ? " is-on" : ""}`}
            aria-pressed={settings.contrast}
            onClick={() => update({ contrast: !settings.contrast })}
          >
            🌓 ניגודיות גבוהה (רקע שחור)
          </button>
          <button
            type="button"
            className={`a11y-toggle${settings.links ? " is-on" : ""}`}
            aria-pressed={settings.links}
            onClick={() => update({ links: !settings.links })}
          >
            🔗 הדגשת קישורים
          </button>
          <button
            type="button"
            className={`a11y-toggle${settings.readable ? " is-on" : ""}`}
            aria-pressed={settings.readable}
            onClick={() => update({ readable: !settings.readable })}
          >
            🔤 גופן קריא
          </button>

          <button type="button" className="a11y-reset" onClick={reset}>
            איפוס הגדרות
          </button>
          <Link
            to="/accessibility"
            className="a11y-statement"
            onClick={() => setOpen(false)}
          >
            הצהרת הנגישות
          </Link>
        </div>
      )}
    </>
  );
}

export default AccessibilityWidget;
