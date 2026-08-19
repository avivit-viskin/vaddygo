import Icon from "../../components/Icon";
import { funnelPercent } from "../../services/usageStatsService";

/*
  UsageFunnel — משפך הרשמה אחד (ועדים או ספקים) במסך נתוני השימוש: כמה נרשמו,
  כמה השלימו, כמה נעצרו באמצע, ואיזה אחוז מהם הגיע עד הסוף. רכיב גנרי — לא
  מכיר את סוג המשתמש, רק מקבל מספרים ותוויות, ולכן ישרת גם משפכים עתידיים.
*/
function UsageFunnel({ title, icon, funnel, completedLabel, stoppedLabel }) {
  const registered = funnel?.registered || 0;
  const completed = funnel?.completed || 0;
  const stopped = funnel?.stopped || 0;
  const last5 = funnel?.registeredLast5Days || 0;
  const last30 = funnel?.registeredLast30Days || 0;
  const percent = funnelPercent(funnel);

  const tile = (num, label, color) => (
    <div
      style={{
        flex: 1,
        minWidth: 90,
        textAlign: "center",
        background: "var(--color-primary-light)",
        borderRadius: "var(--radius-lg)",
        padding: "12px 8px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{num}</div>
      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
        {label}
      </div>
    </div>
  );

  return (
    <section style={{ marginBottom: 24 }}>
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "0 0 10px",
          fontSize: "var(--font-size-base)",
        }}
      >
        <Icon name={icon} size={18} /> {title}
      </h3>

      <div
        style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}
      >
        {tile(registered, "נרשמו", "var(--color-primary-dark)")}
        {tile(completed, "השלימו", "#2e7d32")}
        {tile(stopped, "נעצרו באמצע", "#c0392b")}
      </div>

      {registered === 0 ? (
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
          עדיין אין נתונים להצגה.
        </p>
      ) : (
        <>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`שיעור השלמה — ${title}`}
            style={{
              height: 10,
              borderRadius: 999,
              background: "var(--color-primary-light)",
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: "var(--color-primary)",
              }}
            />
          </div>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            <li>
              <strong>{percent}%</strong> מהנרשמים {completedLabel}
            </li>
            <li>
              {stopped} {stoppedLabel}
            </li>
            {/*
              5 הימים לפני 30: אחרי פנייה לספקים או פרסום, מה שקרה השבוע הוא
              המספר שמעניין — וב-30 יום קפיצה של יומיים נבלעת בממוצע.
            */}
            <li>נרשמו ב-5 הימים האחרונים: {last5}</li>
            <li>נרשמו ב-30 הימים האחרונים: {last30}</li>
          </ul>
        </>
      )}
    </section>
  );
}

export default UsageFunnel;
