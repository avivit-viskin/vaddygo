/*
  BrandName — השם VaadyGo מוצג תמיד מודגש (כלל מחייב מ-ARCHITECTURE.md).
  משתמשים ברכיב הזה בכל מקום שהמותג מופיע, כדי שהכלל לא יישכח.
*/
function BrandName({ withHeart = false }) {
  return (
    <strong className="brand-name">VaadyGo{withHeart ? " 💜" : ""}</strong>
  );
}

export default BrandName;
