import { useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { loadDashboard } from "../services/dashboardService";
import { getExpenses } from "../services/expensesService";
import { currentHebrewYearName } from "../services/schoolYear";
import { formatShekels } from "../services/format";
import { paymentMethodLabel } from "../services/paymentMethods";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import Checkbox from "../components/Checkbox";
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
  // רשימת ההוצאות עצמן — כדי להציג בדוח את הפירוט (מה יצא בכל קטגוריה)
  const { data: expenses } = useApi(getExpenses);
  // אילו קטגוריות הוצאה להסתיר מהדוח שנשלח להורים (ברירת מחדל: ריק = מציגים
  // הכול). מאפשר לשתף רק חלק מהקטגוריות — או לבטל את כל פירוט ההוצאות.
  const [hiddenExpenseCats, setHiddenExpenseCats] = useState(() => new Set());

  function toggleExpenseCat(name) {
    setHiddenExpenseCats((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

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

  // קטגוריות שיצאה מהן הוצאה בפועל — אלו שאפשר לבחור לשתף/להסתיר בדוח.
  const expenseCats = byCategory.filter((c) => (c.spentAmount || 0) > 0);
  const shownExpenseCats = expenseCats.filter(
    (c) => !hiddenExpenseCats.has(c.name)
  );
  // מציגים שורת "סה״כ הוצאות" רק כשכל הקטגוריות מוצגות — אחרת סכום חלקי היה
  // מטעה (נראה כאילו זה כל ההוצאות). התמצית למעלה ממילא מציגה את הסך המלא.
  const allExpensesShown =
    expenseCats.length > 0 && shownExpenseCats.length === expenseCats.length;

  // פירוט ההוצאות עצמן, מקובצות לפי קטגוריה — כדי להציג בדוח מה בדיוק יצא בכל
  // קטגוריה (למשל בהזנה: "מגש פירות — 200 ₪"). מתעלמים מהוצאות המשויכות לקבוצה
  // (subgroupName) כי הן נספרות בכרטיס הקבוצה ולא בפילוח הכללי — כמו בשרת.
  const expensesByCategory = new Map();
  (expenses || [])
    .filter((e) => !e.subgroupName)
    .forEach((e) => {
      const key = (e.category || "").trim() || "ללא קטגוריה";
      const list = expensesByCategory.get(key) || [];
      list.push(e);
      expensesByCategory.set(key, list);
    });
  const itemsFor = (categoryName) =>
    [...(expensesByCategory.get(categoryName) || [])].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

  const shareText = [
    `📄 דוח שנתי — ${ganName} (${year})`,
    `נגבה: ${formatShekels(collectedTotal)} מתוך יעד ${formatShekels(
      collectionTarget
    )} (${progressPercent}%)`,
    `הוצאות: ${formatShekels(totalSpent)}`,
    // פירוט הוצאות בהודעה — הקטגוריות שנבחרו, כל אחת עם הפריטים שיצאו בה
    ...(shownExpenseCats.length > 0
      ? [
          "פירוט הוצאות:",
          ...shownExpenseCats.flatMap((c) => [
            `${c.name} — ${formatShekels(c.spentAmount || 0)}`,
            ...itemsFor(c.name).map(
              (it) =>
                `   • ${it.description?.trim() || "הוצאה"}: ${formatShekels(it.amount)}`
            ),
          ]),
        ]
      : []),
    `יתרה בקופה: ${formatShekels(boxBalance)}`,
    "הופק ב-VaddyGo 💗",
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

      {/* בחירת פירוט הוצאות לשיתוף — מקופל כברירת מחדל כדי לא לדחוף את הדוח
          למטה. לא מודפס בדוח עצמו (no-print). */}
      {expenseCats.length > 0 && (
        <details className="report-controls no-print">
          <summary className="report-controls__summary">
            🧾 פירוט הוצאות בדוח — בחירת קטגוריות לשיתוף
          </summary>
          <p className="report-controls__hint">
            בחרו אילו קטגוריות הוצאה יופיעו בדוח שנשלח להורים. אפשר לבחור רק חלק —
            או לבטל את כולן כדי לא לשתף פירוט הוצאות.
          </p>
          <div className="report-controls__list">
            {expenseCats.map((c) => (
              <Checkbox
                key={c.name}
                id={`exp-cat-${c.name}`}
                label={`${c.name} — ${formatShekels(c.spentAmount || 0)}`}
                checked={!hiddenExpenseCats.has(c.name)}
                onChange={() => toggleExpenseCat(c.name)}
              />
            ))}
          </div>
        </details>
      )}

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

        {/* מדור הוצאות לפי קטגוריה — מציג רק את הקטגוריות שנבחרו לשיתוף. אם אין
            הוצאות בכלל → הודעה; אם יש הוצאות אבל בוטלו כל הקטגוריות → המדור אינו
            מופיע בדוח (בעלת המוצר בחרה לא לשתף פירוט הוצאות). */}
        {(expenseCats.length === 0 || shownExpenseCats.length > 0) && (
          <section className="report__section">
            <h2 className="report__h2">הוצאות לפי קטגוריה</h2>
            {expenseCats.length === 0 ? (
              <p className="report__empty">עדיין לא נרשמו הוצאות.</p>
            ) : (
              <div className="report__expenses">
                {shownExpenseCats.map((c) => {
                  const items = itemsFor(c.name);
                  return (
                    <div className="report__exp-cat" key={c.name}>
                      <div className="report__exp-cat-head">
                        <span>{c.name}</span>
                        <span className="report__num">
                          {formatShekels(c.spentAmount || 0)}
                        </span>
                      </div>
                      {items.length > 0 && (
                        <ul className="report__exp-items">
                          {items.map((it) => (
                            <li key={it.id}>
                              <span className="report__exp-desc">
                                {it.description?.trim() || "הוצאה"}
                              </span>
                              <span className="report__num">
                                {formatShekels(it.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
                {allExpensesShown && (
                  <div className="report__exp-total">
                    <span>סה״כ הוצאות</span>
                    <span className="report__num">{formatShekels(totalSpent)}</span>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

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
