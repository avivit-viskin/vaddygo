import "../styles/supplier-app.css";

/*
  SupplierHome — ראש דף הבית של הספק: שני אריחי מדד גדולים בלבד — פניות וצפיות.
  המוצרים עצמם אינם מוצגים כאן (בקשת בעלת המוצר: דף בית נקי) — הם מנוהלים
  ונצפים בלשונית "מוצרים".
*/
function SupplierHome({ vendor }) {
  const views = vendor?.views || 0;
  const leads = vendor?.leads || 0;

  return (
    <div className="sup-stats sup-stats--primary" data-tour="sup-stats">
      <div className="sup-stat sup-stat--big">
        <div className="sup-stat__num">{leads}</div>
        <div className="sup-stat__label">פניות</div>
      </div>
      <div className="sup-stat sup-stat--big">
        <div className="sup-stat__num">{views}</div>
        <div className="sup-stat__label">צפיות</div>
      </div>
    </div>
  );
}

export default SupplierHome;
