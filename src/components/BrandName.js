/*
  BrandName — השם VaddyGo מוצג תמיד מודגש (כלל מחייב מ-ARCHITECTURE.md).
  משתמשים ברכיב הזה בכל מקום שהמותג מופיע, כדי שהכלל לא יישכח.
*/
function BrandName({ withHeart = false }) {
  return (
    <strong className="brand-name">VaddyGo{withHeart ? " 💜" : ""}</strong>
  );
}

export default BrandName;
