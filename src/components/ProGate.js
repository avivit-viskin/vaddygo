import { Link } from "react-router-dom";
import { isFeatureLocked } from "../services/plan";
import Button from "./Button";
import Icon from "./Icon";

/*
  ProGate — עוטף פעולת/כפתור פרו. אם הפיצ'ר נעול (המשתמשת אינה מנויה) — מציג
  כפתור עם כתר שמוביל לעמוד השדרוג; אחרת — מציג את הפעולה עצמה (children).
  כך "סוגרים" פיצ'רי פרו בלי לשכפל לוגיקה בכל מקום.
*/
function ProGate({ feature, label, variant = "secondary", children }) {
  if (!isFeatureLocked(feature)) {
    return children;
  }
  return (
    <Link to="/upgrade" className="pro-gate">
      <Button variant={variant}>
        <Icon name="crown" size={15} /> {label}
      </Button>
    </Link>
  );
}

export default ProGate;
