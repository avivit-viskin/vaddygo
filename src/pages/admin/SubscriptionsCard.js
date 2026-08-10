import { useCallback } from "react";
import useApi from "../../hooks/useApi";
import Icon from "../../components/Icon";
import Spinner from "../../components/Spinner";
import ErrorMessage from "../../components/ErrorMessage";
import {
  getSubscriptions,
  subscriptionStatus,
  validUntilText,
} from "../../services/subscriptionsService";
import "../../styles/subscriptions.css";

/*
  SubscriptionsCard — מי משלם ל-VaddyGo ועד מתי, בשני ערוצי ההכנסה (ועדים
  וספקים). נועד לשאלה עסקית אחת: מה פעיל עכשיו ומה עומד לפוג — כדי שאפשר
  יהיה לפנות ללקוח לפני שהמנוי נסגר, ולא אחרי.

  הסטטוס (פעיל / פג בקרוב / פג / לא מנוי) מחושב **בשרת**, כדי שלא ייווצר מצב
  שהמסך מראה "פעיל" בזמן שהשרת כבר חוסם את הפיצ'רים.
*/
function SubscriptionList({ title, icon, rows }) {
  if (!rows || rows.length === 0) {
    return (
      <section className="subs__group">
        <h4 className="subs__group-title">
          <Icon name={icon} size={16} /> {title}
        </h4>
        <p className="subs__empty">אין עדיין רשומות להצגה.</p>
      </section>
    );
  }

  return (
    <section className="subs__group">
      <h4 className="subs__group-title">
        <Icon name={icon} size={16} /> {title} ({rows.length})
      </h4>
      <ul className="subs__list">
        {rows.map((row) => {
          const status = subscriptionStatus(row.status);
          return (
            <li key={row.id} className="subs__row">
              <span className="subs__name">{row.name}</span>
              <span className={`subs__pill subs__pill--${status.tone}`}>
                {status.label}
              </span>
              <span className="subs__until">{validUntilText(row)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SubscriptionsCard() {
  const { data, isLoading, error } = useApi(
    useCallback(() => getSubscriptions(), [])
  );

  return (
    <section className="subs">
      <h3 className="subs__title">
        <Icon name="wallet" size={18} /> מנויים — מי משלם ועד מתי
      </h3>

      {isLoading && <Spinner />}
      {!isLoading && error && <ErrorMessage message={error} />}

      {!isLoading && !error && data && (
        <>
          <p className="subs__summary">
            <strong>{data.activeCount}</strong> מנויים פעילים
            {data.expiringSoonCount > 0 && (
              <>
                {" · "}
                <span className="subs__warn">
                  {data.expiringSoonCount} פגים בתוך 30 יום
                </span>
              </>
            )}
          </p>

          <SubscriptionList
            title="ועדי הורים"
            icon="users"
            rows={data.committees}
          />
          <SubscriptionList title="ספקים" icon="tag" rows={data.suppliers} />
        </>
      )}
    </section>
  );
}

export default SubscriptionsCard;
