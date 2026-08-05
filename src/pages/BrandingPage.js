import { useState } from "react";
import { Link } from "react-router-dom";
import { getBranding, setBranding, clearLogo } from "../services/branding";
import { fileToResizedDataUrl } from "../services/imageUpload";
import { getOnboarding } from "../services/onboardingService";
import { toastSuccess } from "../services/toastBus";
import Button from "../components/Button";
import Icon from "../components/Icon";
import "../styles/branding.css";

/*
  BrandingPage (/branding) — פיצ'ר פרו: מיתוג אישי לגן.
  מעלים לוגו (מכווץ ל-base64) ובוחרים צבע מותג; שניהם מוחלים על הדוח השנתי
  להורים (תצוגה מקדימה כאן). נשמר מקומית.
*/
function BrandingPage() {
  const [branding, setBrandingState] = useState(() => getBranding());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ganName = getOnboarding()?.ganName || "הגן שלי";

  async function onLogo(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const dataUrl = await fileToResizedDataUrl(file, 300, 0.82);
      setBrandingState(setBranding({ logo: dataUrl }));
      toastSuccess("הלוגו נשמר ✓");
    } catch (err) {
      setError(err.message || "לא הצלחנו להעלות את הלוגו");
    } finally {
      setBusy(false);
    }
  }

  function onColor(event) {
    setBrandingState(setBranding({ color: event.target.value }));
  }

  function removeLogo() {
    setBrandingState(clearLogo());
  }

  const accent = branding.color || "var(--color-primary)";

  return (
    <div className="branding-page">
      <div className="page-header">
        <h2>מיתוג אישי לגן</h2>
        <Link to="/">
          <Button variant="secondary">
            <Icon name="home" size={16} /> חזרה
          </Button>
        </Link>
      </div>

      <p className="branding-intro">
        הוסיפו את הלוגו והצבע של הגן — הם יופיעו על הדוח השנתי להורים ויתנו לו
        מראה מקצועי ומזוהה.
      </p>

      <div className="branding-controls">
        <div className="branding-field">
          <span className="field__label">לוגו הגן</span>
          <label className="branding-upload">
            <Icon name="image" size={16} /> {busy ? "מעלה..." : "העלאת לוגו"}
            <input
              type="file"
              accept="image/*"
              onChange={onLogo}
              disabled={busy}
              hidden
            />
          </label>
          {branding.logo && (
            <button type="button" className="branding-remove" onClick={removeLogo}>
              <Icon name="trash" size={14} /> הסרה
            </button>
          )}
          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="branding-field">
          <label className="field__label" htmlFor="branding-color">
            צבע המותג
          </label>
          <input
            id="branding-color"
            type="color"
            className="branding-color"
            value={branding.color || "#f9cfe0"}
            onChange={onColor}
          />
        </div>
      </div>

      <h3 className="report__h2" style={{ marginTop: 20 }}>
        תצוגה מקדימה
      </h3>
      <div className="branding-preview">
        <div
          className="branding-preview__head"
          style={{ borderColor: accent }}
        >
          {branding.logo && (
            <img className="branding-preview__logo" src={branding.logo} alt="לוגו הגן" />
          )}
          <p className="branding-preview__eyebrow" style={{ color: accent }}>
            דוח שנתי להורים
          </p>
          <p className="branding-preview__title">{ganName}</p>
        </div>
        <p className="branding-preview__hint">
          כך ייראה ראש הדוח.{" "}
          <Link to="/annual-report">מעבר לדוח השנתי »</Link>
        </p>
      </div>
    </div>
  );
}

export default BrandingPage;
