import "../styles/supplier-app.css";

/*
  SupplierProductStats — שורת אריחים בראש לשונית "מוצרים": מספר מוצרים, מוצרים
  שדורשים טיפול (חסר מחיר או תמונה), צפיות בקטלוג, ומוצרים מאושרים (מלאים).
  להצגה בלבד — נותן לספק תמונת מצב מהירה לפני העריכה.
*/
function isReady(p) {
  return Number(p?.price) > 0 && Boolean((p?.imageUrl || "").trim());
}

function SupplierProductStats({ vendor }) {
  const products = vendor?.products || [];
  const total = products.length;
  const ready = products.filter(isReady).length;
  const attention = total - ready;
  const views = vendor?.views || 0;

  const tiles = [
    { key: "total", num: total, label: "מוצרים" },
    { key: "attention", num: attention, label: "דורש טיפול", warn: attention > 0 },
    { key: "views", num: views, label: "צפיות" },
    { key: "ready", num: ready, label: "מאושרים" },
  ];

  return (
    <div className="sup-stats sup-stats--products">
      {tiles.map((t) => (
        <div
          key={t.key}
          className={`sup-stat sup-stat--sm${t.warn ? " sup-stat--warn" : ""}`}
        >
          <div className="sup-stat__num">{Number(t.num).toLocaleString("he-IL")}</div>
          <div className="sup-stat__label">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

export default SupplierProductStats;
