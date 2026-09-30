/*
  ViewsChart — גרף "צפיות לאורך זמן" לספק. מקבל את הסדרה היומית הדלילה מהשרת
  (רק ימים עם צפייה) ואת הטווח, ובונה עמודות. הדלי מותאם לאורך הטווח כדי
  שהגרף יישאר קריא גם בנייד: יומי לטווח קצר, שבועי לבינוני, חודשי לשנה.
  בלי ספריות חיצוניות — עמודות פשוטות עם גובה יחסי לשיא.
*/
const DAY_MS = 86400000;
const HE_MONTHS = [
  "ינו", "פבר", "מרץ", "אפר", "מאי", "יוני",
  "יולי", "אוג", "ספט", "אוק", "נוב", "דצמ",
];

function startOfDayUTC(value) {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function bucketize(series, from, to) {
  const start = startOfDayUTC(from);
  const end = startOfDayUTC(to);
  const spanDays = Math.round((end - start) / DAY_MS) + 1;
  const mode = spanDays <= 31 ? "day" : spanDays <= 130 ? "week" : "month";

  const buckets = [];
  if (mode === "month") {
    let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cur <= end) {
      const next = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
      buckets.push({
        start: cur,
        end: next,
        label: HE_MONTHS[cur.getUTCMonth()],
        count: 0,
      });
      cur = next;
    }
  } else {
    const step = mode === "week" ? 7 : 1;
    let cur = new Date(start);
    while (cur <= end) {
      const next = new Date(cur.getTime() + step * DAY_MS);
      buckets.push({
        start: new Date(cur),
        end: next,
        label: `${cur.getUTCDate()}.${cur.getUTCMonth() + 1}`,
        count: 0,
      });
      cur = next;
    }
  }

  for (const point of series || []) {
    const t = startOfDayUTC(point.day).getTime();
    const b = buckets.find((x) => t >= x.start.getTime() && t < x.end.getTime());
    if (b) b.count += Number(point.count) || 0;
  }
  return { buckets, mode };
}

function ViewsChart({ series = [], from, to }) {
  if (!from || !to) return null;
  const { buckets } = bucketize(series, from, to);
  const totalInRange = buckets.reduce((s, b) => s + b.count, 0);

  if (totalInRange === 0) {
    return (
      <p className="sup-chart__empty">
        עדיין אין צפיות בתקופה שנבחרה. כשוועדים יפתחו את הכרטיס — זה יופיע כאן
        כגרף.
      </p>
    );
  }

  const max = Math.max(...buckets.map((b) => b.count), 1);
  const peakIdx = buckets.reduce(
    (best, b, i) => (b.count > buckets[best].count ? i : best),
    0
  );
  // הרבה עמודות (למשל 30 ימים) — מדללים תוויות כדי שלא ייצפפו
  const labelEvery = Math.ceil(buckets.length / 8);

  return (
    <div className="sup-chart">
      <div className="sup-chart__bars" role="img" aria-label="גרף צפיות לאורך זמן">
        {buckets.map((b, i) => {
          const h = b.count === 0 ? 0 : Math.max(6, Math.round((b.count / max) * 100));
          return (
            <div key={i} className="sup-chart__col">
              <div className="sup-chart__bar-wrap">
                {b.count > 0 && i === peakIdx && (
                  <span className="sup-chart__peak">{b.count}</span>
                )}
                <div
                  className={`sup-chart__bar${
                    i === peakIdx ? " sup-chart__bar--peak" : ""
                  }`}
                  style={{ height: `${h}%` }}
                  title={`${b.label}: ${b.count} צפיות`}
                />
              </div>
              <span className="sup-chart__xlabel">
                {i % labelEvery === 0 || i === buckets.length - 1 ? b.label : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="sup-chart__caption">
        {totalInRange.toLocaleString("he-IL")} צפיות בתקופה · השיא:{" "}
        {buckets[peakIdx].count} ({buckets[peakIdx].label})
      </p>
    </div>
  );
}

export default ViewsChart;
