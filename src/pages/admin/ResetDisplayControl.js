import Icon from "../../components/Icon";
import {
  getBaseline,
  setBaseline,
  clearBaseline,
} from "../../services/usageBaseline";
import "../../styles/usage-baseline.css";

/*
  ResetDisplayControl — כפתור "איפוס תצוגה" למשפך בודד בדוח השימוש. מאפס רק את
  מה שהמנהלת רואה (קו-בסיס בדפדפן שלה), בלי למחוק אף נתון בשרת. onChange מודיע
  להורה לרענן את התצוגה אחרי איפוס/ביטול.
*/
function ResetDisplayControl({ funnelKey, current, onChange }) {
  const base = getBaseline(funnelKey);

  function doReset() {
    setBaseline(funnelKey, current);
    onChange();
  }
  function undo() {
    clearBaseline(funnelKey);
    onChange();
  }

  if (base) {
    let when = "";
    try {
      when = new Date(base.at).toLocaleDateString("he-IL");
    } catch {
      when = "";
    }
    return (
      <p className="usage-reset usage-reset--active">
        <Icon name="check" size={14} /> התצוגה אופסה{when ? ` (${when})` : ""} —
        מוצג מאז.{" "}
        <button type="button" className="usage-reset__link" onClick={undo}>
          ביטול איפוס
        </button>
      </p>
    );
  }

  return (
    <p className="usage-reset">
      <button type="button" className="usage-reset__link" onClick={doReset}>
        <Icon name="clock" size={14} /> אפס תצוגה (להתחיל לספור מכאן)
      </button>
    </p>
  );
}

export default ResetDisplayControl;
