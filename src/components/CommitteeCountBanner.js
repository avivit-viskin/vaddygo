import { useEffect, useState } from "react";
import { getCommitteeCount } from "../services/publicStatsService";

/*
  CommitteeCountBanner — כמה ועדי הורים כבר רשומים ל-VaddyGo, "חי" (מתעדכן כל
  30 שניות). תמריץ לספק: הקטלוג שלו גלוי לכל הוועדים האלה. מוצג ראשון בדף הבית
  של הספק. שורה אחת קומפקטית כדי לא לתפוס מקום.
*/
function CommitteeCountBanner() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getCommitteeCount()
        .then((n) => {
          if (!cancelled) setCount(n);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (count == null || count <= 0) {
    return null;
  }

  return (
    <div className="sup-committee-count" role="status">
      <span className="sup-committee-count__num">
        {count.toLocaleString("he-IL")}
      </span>
      <span className="sup-committee-count__text">
        ועדי הורים כבר ב-VaddyGo — הקטלוג שלך גלוי לכולם 🎉
      </span>
    </div>
  );
}

export default CommitteeCountBanner;
