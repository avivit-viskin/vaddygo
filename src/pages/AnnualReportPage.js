import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { loadDashboard } from "../services/dashboardService";
import { currentHebrewYearName } from "../services/schoolYear";
import { formatShekels } from "../services/format";
import { paymentMethodLabel } from "../services/paymentMethods";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import Icon from "../components/Icon";
import { whatsappShareUrl } from "../services/whatsapp";
import { getBranding } from "../services/branding";
import "../styles/report.css";

/*
  AnnualReportPage (/annual-report) — פיצ'ר פרו: דוח שנתי שקוף להורים.
  מפיק מנתוני מסך הבית (dashboardService) סיכום כספי: כמה נגבה מול היעד, הוצאות
  לפי קטגוריה, פירוק אמצעי תשלום, ויתרת הקופה. כפתור "הדפסה / שמירה כ-PDF"
  (הדפסת הדפדפן) ושיתוף תמצית בוואטסאפ. עובד גם בלי שרת (נתונים מקומיים).
*/
function AnnualReportPage() {
  const { data: dashboard, isLoading } = useApi(loadDashboard);

  if (isLoading) {
    return <Spinner text="מכינים את הדוח השנתי..." />;
  }

  if (!dashboard) {
    return (
      <EmptyState icon="📄" message="עוד אין נתונים לדוח — נגדיר קודם את הגן.">
        <Link to="/">
          <Button>חזרה למסך הבית</Button>
        </Link>
      </EmptyState>
    );
  }

  const year = currentHebrewYearName();
  const {
    ganName,
    childrenCount = 0,
    collectionTarget = 0,
    collectedTotal = 0,
    openDebt = 0,
    boxBalance = 0,
    progressPercent = 0,
    byCategory = [],
    byPaymentMethod = [],
  } = dashboard;

  const totalSpent = byCategory.reduce((sum, c) => sum + (c.spentAmount || 0), 0);
  const branding = getBranding();

  const shareText = [
    `📄 דוח שנתי — ${ganName} (${year})`,
    `נגבה: ${formatShekels(collectedTotal)} מתוך יעד ${formatShekels(
      collectionTarget
    )} (${progressPercent}%)`,
    `הוצאות: ${formatShekels(totalSpent)}`,
    `יתרה בקופה: ${formatShekels(boxBalance)}`,
    "הופק ב-VaddyGo 🩷",
  ].join("\n");

  return (
    <div className="report-page">
      <div className="report-toolbar no-print">
        <Link to="/">
          <Button variant="secondary">
            <Icon name="home" size={16} /> חזרה
          </Button>
        </Link>
        <div className="report-toolbar__actions">
          <a href={whatsappShareUrl(shareText)} target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <Icon name="message" size={16} /> שיתוף להורים
            </Button>
          </a>
          <Button onClick={() => window.print()}>🖨️ הדפסה / שמירה כ-PDF</Button>
        </div>
      </div>

      <article className="report" dir="rtl">
        <header
          className="report__head"
          style={branding.color ? { borderColor: branding.color } : undefined}
        >
          {branding.logo && (
            <img className="report__logo" src={branding.logo} alt="לוגו הגן" />
          )}
          <p
            className="report__eyebrow"
            style={branding.color ? { color: branding.color } : undefined}
          >
            דוח שנתי להורים
          </p>
          <h1 className="report__title">{ganName}</h1>
          <p className="report__sub">
            שנת {year}
            {childrenCount > 0 ? ` · ${childrenCount} ילדים` : ""}
          </p>
        </header>

        <section className="report__hero" aria-label="תמצית">
          <div className="report__stat">
            <span className="report__stat-num">{formatShekels(collectedTotal)}</span>
            <span className="report__stat-label">נגבה</span>
          </div>
          <div className="report__stat">
            <span className="report__stat-num">{formatShekels(totalSpent)}</span>
            <span className="report__stat-label">הוצאות</span>
          </div>
          <div className="report__stat report__stat--balance">
            <span className="report__stat-num">{formatShekels(boxBalance)}</span>
            <span className="report__stat-label">יתרה בקופה</span>
          </div>
        </section>

        <section className="report__section">
          <h2 className="report__h2">גבייה</h2>
          <div className="report__bar" aria-hidden="true">
            <div
              className="report__bar-fill"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
          <table className="report__table">
            <tbody>
              <tr>
                <td>יעד הגבייה</td>
                <td className="report__num">{formatShekels(collectionTarget)}</td>
              </tr>
              <tr>
                <td>נגבה עד כה</td>
                <td className="report__num">
                  {formatShekels(collectedTotal)} ({progressPercent}%)
                </td>
              </tr>
              <tr>
                <td>נותר לגבייה</td>
                <td className="report__num">{formatShekels(openDebt)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="report__section">
          <h2 className="report__h2">הוצאות לפי קטגוריה</h2>
          {byCategory.length === 0 ? (
            <p className="report__empty">עדיין לא נרשמו הוצאות.</p>
          ) : (
            <table className="report__table">
              <thead>
                <tr>
                  <th>קטגוריה</th>
                  <th className="report__num">הוצאה</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="report__num">{formatShekels(c.spentAmount || 0)}</td>
                  </tr>
                ))}
                <tr className="report__total-row">
                  <td>סה״כ הוצאות</td>
                  <td className="report__num">{formatShekels(totalSpent)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </section>

        {byPaymentMethod.some((m) => m.amount > 0) && (
          <section className="report__section">
            <h2 className="report__h2">נגבה לפי אמצעי תשלום</h2>
            <table className="report__table">
              <tbody>
                {byPaymentMethod
                  .filter((m) => m.amount > 0)
                  .map((m) => (
                    <tr key={m.method}>
                      <td>{paymentMethodLabel(m.method)}</td>
                      <td className="report__num">{formatShekels(m.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="report__foot">
          הופק אוטומטית ב-VaddyGo · דוח שקוף להורי {ganName}
        </footer>
      </article>
    </div>
  );
}

export default AnnualReportPage;
