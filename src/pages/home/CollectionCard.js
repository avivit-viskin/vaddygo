import { useState } from "react";
import Card from "../../components/Card";
import { formatShekels } from "../../services/format";

/*
  CollectionCard — כרטיס הגבייה הראשי (UI_SPEC ס' 8):
  החלפה בין סכום הגבייה הכולל ליתרת הקופה מול החוב הפתוח,
  בר התקדמות באחוזים, ופירוק לפי אמצעי תשלום (ביט/פייבוקס/מזומן).
*/
const METHOD_LABELS = { bit: "ביט", paybox: "פייבוקס", cash: "מזומן" };

function CollectionCard({ dashboard }) {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <Card>
      <div className="collection__top">
        {showBalance ? (
          <div className="collection__balance">
            <div>
              <p className="collection__label">יתרת קופה</p>
              <p className="collection__amount">{formatShekels(dashboard.boxBalance)}</p>
            </div>
            <div>
              <p className="collection__label">חוב פתוח</p>
              <p className="collection__amount collection__amount--debt">
                {formatShekels(dashboard.openDebt)}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="collection__label">סכום הגבייה הכולל</p>
            <p className="collection__amount">{formatShekels(dashboard.collectionTarget)}</p>
          </div>
        )}
        <button
          type="button"
          className="collection__toggle"
          aria-pressed={showBalance}
          onClick={() => setShowBalance((prev) => !prev)}
        >
          {showBalance ? "ליעד הגבייה" : "ליתרת הקופה"}
        </button>
      </div>

      <div
        className="progress"
        role="progressbar"
        aria-valuenow={dashboard.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="התקדמות הגבייה"
      >
        <div
          className="progress__fill"
          style={{ width: `${dashboard.progressPercent}%` }}
        />
      </div>
      <p className="progress__text">{dashboard.progressPercent}% מהיעד נגבה</p>

      <ul className="methods">
        {dashboard.byPaymentMethod.map((m) => (
          <li key={m.method} className="methods__item">
            <span className="methods__name">{METHOD_LABELS[m.method] || m.method}</span>
            <span className="methods__amount">{formatShekels(m.amount)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default CollectionCard;
