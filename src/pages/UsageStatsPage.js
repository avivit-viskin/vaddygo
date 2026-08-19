import { useCallback, useState } from "react";
import useApi from "../hooks/useApi";
import Card from "../components/Card";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import BrandName from "../components/BrandName";
import UsageFunnel from "./admin/UsageFunnel";
import ProTestControl from "./admin/ProTestControl";
import SubscriptionsCard from "./admin/SubscriptionsCard";
import SecurityStatusCard from "./admin/SecurityStatusCard";
import ResetDisplayControl from "./admin/ResetDisplayControl";
import { getUsageStats } from "../services/usageStatsService";
import { applyBaseline, getBaseline } from "../services/usageBaseline";
import { isSuperAdmin } from "../services/authService";

/*
  UsageStatsPage (/admin/usage) — נתוני השימוש של המנהלת: כמה נרשמו, כמה
  השלימו את ההגדרה וכמה נעצרו באמצע — בצד הוועד ובצד הספקים. מיועד להחלטות
  מוצר ("איפה אנשים נוטשים"), ולכן מציג מספרים מצטברים בלבד — בלי שמות.

  הנתונים מגיעים אך ורק מהשרת (SuperAdmin בלבד); אין נפילה מקומית, כי מספר
  מומצא בדפדפן יטעה בהחלטה עסקית.
*/
function UsageStatsPage() {
  const isAdmin = isSuperAdmin();
  // כפייה על רענון אחרי "איפוס תצוגה" (קו-הבסיס נשמר ב-localStorage ונקרא ברינדור)
  const [, forceRerender] = useState(0);
  const bump = () => forceRerender((n) => n + 1);
  // מי שאינה מנהלת לא פונה לשרת בכלל — אין טעם בבקשה שתחזור 403
  const fetcher = useCallback(
    () => (isAdmin ? getUsageStats() : Promise.resolve(null)),
    [isAdmin]
  );
  const { data, isLoading, error } = useApi(fetcher);

  if (!isAdmin) {
    return (
      <div className="page">
        <Card title="נתוני שימוש">
          <p>הדף הזה מיועד למנהלת <BrandName /> בלבד.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="page">
      <Card
        title={
          <span>
            <Icon name="chart" size={20} /> נתוני שימוש
          </span>
        }
      >
        {isLoading && <Spinner />}
        {!isLoading && error && <ErrorMessage message={error} />}
        {!isLoading && !error && data && (
          <>
            <p
              style={{
                margin: "0 0 16px",
                color: "var(--color-text-muted)",
                fontSize: "var(--font-size-sm)",
              }}
            >
              כמה נרשמו, כמה השלימו את ההגדרה וכמה נעצרו באמצע. מספרים בלבד —
              בלי שמות ובלי פרטים אישיים.
            </p>
            <UsageFunnel
              title="ועדי הורים"
              icon="users"
              funnel={applyBaseline(data.committees, getBaseline("committees"))}
              completedLabel="השלימו את הגדרת הגן"
              stoppedLabel="נרשמו ולא סיימו את האשף"
            />
            <ResetDisplayControl
              funnelKey="committees"
              current={data.committees}
              onChange={bump}
            />
            <p
              style={{
                margin: "0 0 22px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--color-primary-dark)",
              }}
            >
              <Icon name="crown" size={15} /> מתוכם רכשו מסלול פרו:{" "}
              <strong>{data.committees.pro || 0}</strong>
            </p>
            <UsageFunnel
              title="ספקים"
              icon="tag"
              funnel={applyBaseline(data.suppliers, getBaseline("suppliers"))}
              completedLabel="כרטיס מוכן להצגה לוועדים"
              stoppedLabel="נרשמו ולא השלימו את הכרטיס"
            />
            <ResetDisplayControl
              funnelKey="suppliers"
              current={data.suppliers}
              onChange={bump}
            />
            <p
              style={{
                margin: "0 0 22px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--color-primary-dark)",
              }}
            >
              <Icon name="crown" size={15} /> מתוכם רכשו מסלול פרו:{" "}
              <strong>{data.suppliers.pro || 0}</strong>
            </p>
            {/* האם ההגנות שהוגדרו ב-Railway באמת פועלות */}
            <SecurityStatusCard />
            {/* מי משלם ל-VaddyGo ועד מתי — שני ערוצי ההכנסה במקום אחד */}
            <SubscriptionsCard />
            {/* פתיחה/סגירה של פרו למוסד הפעיל (נשמר בשרת) */}
            <ProTestControl />
          </>
        )}
      </Card>
    </div>
  );
}

export default UsageStatsPage;
