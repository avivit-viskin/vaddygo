import { useCallback } from "react";
import useApi from "../hooks/useApi";
import Card from "../components/Card";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import BrandName from "../components/BrandName";
import UsageFunnel from "./admin/UsageFunnel";
import { getUsageStats } from "../services/usageStatsService";
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
              funnel={data.committees}
              completedLabel="השלימו את הגדרת הגן"
              stoppedLabel="נרשמו ולא סיימו את האשף"
            />
            <UsageFunnel
              title="ספקים"
              icon="tag"
              funnel={data.suppliers}
              completedLabel="כרטיס מוכן להצגה לוועדים"
              stoppedLabel="נרשמו ולא השלימו את הכרטיס"
            />
          </>
        )}
      </Card>
    </div>
  );
}

export default UsageStatsPage;
