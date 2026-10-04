import Card from "../../components/Card";
import Icon from "../../components/Icon";
import KosherBadge from "../../components/KosherBadge";
import "../../styles/hotDeals.css";

/*
  HotDealsStrip — מדף "מבצעים חמים לוועד": רצועה אופקית של הספקים שיש להם מבצע
  פעיל (שדה offer), כשהמומלצים קודם. נותן לוועד גישה מהירה להטבות בלי לגלול את
  כל רשימת הספקים — וכל לחיצה היא פנייה פוטנציאלית לספק (מקור ההכנסה של VaddyGo).
  מוצג רק כשיש לפחות מבצע אחד.
*/
function HotDealsStrip({ vendors, onOpen }) {
  const deals = (vendors || [])
    .filter((v) => (v.offer || "").trim())
    .slice()
    .sort((a, b) => {
      // מומלצים קודם, ואז לפי דירוג — כדי שהמבצעים הטובים ביותר יהיו ראשונים
      if (!!b.featured !== !!a.featured) {
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
      return (b.averageRating || 0) - (a.averageRating || 0);
    });

  if (deals.length === 0) {
    return null;
  }

  return (
    <Card
      title={
        <span style={{ color: "var(--color-primary-dark)" }}>
          🔥 מבצעים חמים לוועד
        </span>
      }
    >
      <div className="hot-deals" role="list">
        {deals.map((vendor) => {
          const monogram = (vendor.name || "?").trim().charAt(0) || "?";
          const avatarImg = vendor.products?.find((p) => p.imageUrl)?.imageUrl;
          return (
            <button
              key={vendor.id}
              type="button"
              role="listitem"
              className={"hot-deal" + (vendor.featured ? " hot-deal--featured" : "")}
              onClick={() => onOpen(vendor)}
            >
              <span className="hot-deal__head">
                <span className="hot-deal__avatar" aria-hidden="true">
                  {avatarImg ? (
                    <img src={avatarImg} alt="" loading="lazy" />
                  ) : (
                    monogram
                  )}
                </span>
                <span className="hot-deal__name">
                  {vendor.name}
                  {vendor.isKosher && (
                    <>
                      {" "}
                      <KosherBadge />
                    </>
                  )}
                </span>
              </span>
              {vendor.category && (
                <span className="hot-deal__cat">
                  {vendor.category}
                  {vendor.city ? ` · ${vendor.city}` : ""}
                </span>
              )}
              <span className="hot-deal__offer">
                <Icon name="tag" size={13} /> {vendor.offer}
              </span>
              {vendor.featured && (
                <span className="hot-deal__featured">⭐ מומלץ</span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default HotDealsStrip;
