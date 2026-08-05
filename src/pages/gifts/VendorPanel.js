import { useState } from "react";
import EmptyState from "../../components/EmptyState";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import Icon from "../../components/Icon";
import { formatShekels } from "../../services/format";
import { whatsappUrlWithText } from "../../services/whatsapp";
import { groupByFolder } from "../../services/vendorFolders";
import { getOnboarding } from "../../services/onboardingService";
import { recordLead } from "../../services/vendorsService";

/*
  VendorPanel — דף ספק (UI_SPEC ס' 12): שם הספק → תיקיות לפי חג/אירוע →
  לחיצה על תיקייה פותחת את המוצרים (תמונה + מחיר) עם קישור וואטסאפ לספק
  ובו הודעה מוכנה. מוצג בתוך מודאל בלחיצה על שם ספק. מציגים רק תיקיות עם מוצרים.
*/
// הודעת וואטסאפ מוכנה לספק — מציינת שהוועד הגיע דרך VaddyGo, כדי שהספק ידע
// מאיפה הפנייה. אם נפתחה תיקיית חג ספציפית — מוסיפים את שמה להקשר.
function supplierMessage(folderName) {
  const suffix = folderName && folderName !== "כללי" ? ` ל${folderName}` : "";
  return `היי! 🙂 הגענו אליכם דרך VaddyGo — אפליקציה לניהול ועדי הורים. אנחנו ועד הורים ומעוניינים במוצרים שלכם${suffix}, אפשר לקבל פרטים ומחירים?`;
}

// בקשת הצעת מחיר — ליד מזוהה: כולל את שם הגן כדי שהספק ידע מי פונה (לא אנונימי).
function quoteRequestMessage(vendorName, ganName) {
  const who = ganName ? `ועד ההורים של ${ganName}` : "ועד הורים";
  return `היי ${vendorName || ""}! 🙂 אנחנו ${who}, הגענו אליכם דרך VaddyGo ונשמח לקבל הצעת מחיר. מה תוכלו להציע לנו?`;
}

// הודעת התעניינות לתשלום בביט — נפתחת בוואטסאפ של מספר הביט. אם הוועד גלש
// בתיקייה מסוימת, ההודעה מציינת אותה ("מתיקיית ...") כדי שהספק ידע על מה מדובר.
function bitMessage(folderName) {
  const suffix =
    folderName && folderName !== "כללי" ? ` מתיקיית «${folderName}»` : "";
  return `היי! 🙂 הגענו אליכם דרך VaddyGo. אנחנו ועד הורים ומעוניינים במוצרים שלכם${suffix} — נשמח לתאם רכישה ותשלום בביט. אפשר פרטים?`;
}

// האם הערך הוא קישור (ואז לוחצים ועוברים ישירות) או מספר טלפון (מציגים אותו)
const isPayUrl = (s) => /^https?:\/\//i.test((s || "").trim());

// תג-מותג קטן לאמצעי התשלום — זהה במראה לקוביות מסך הבית (ביט טורקיז, פייבוקס
// כחול). לאשראי/העברה בנקאית אמוג'י. שומר על "לא גדולים" כמו שביקשו.
const brandChip = (bg) => ({
  display: "inline-block",
  borderRadius: 6,
  padding: "2px 8px",
  fontSize: 12,
  fontWeight: 700,
  color: "#fff",
  background: bg,
  lineHeight: 1.4,
});
function PayBrandMark({ method }) {
  if (method.brand === "bit") return <span style={brandChip("#22b8c2")}>bit</span>;
  if (method.brand === "paybox")
    return <span style={brandChip("var(--color-paybox)")}>payBox</span>;
  return (
    <span aria-hidden="true" style={{ fontSize: 17, lineHeight: 1 }}>
      {method.icon}
    </span>
  );
}
const payChipStyle = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 12px",
  borderRadius: 10,
  border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
  background: active ? "var(--color-primary-light)" : "var(--color-surface)",
  color: "var(--color-text)",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
});

function VendorPanel({
  vendor,
  onEdit,
  onShareEditLink,
  onApproveDelete,
  onDismissDelete,
  paidTotal = 0,
  readOnly = false,
}) {
  const [openFolder, setOpenFolder] = useState(null);
  // התיקייה האחרונה שהוועד פתח — משמשת להודעת הביט ("מתיקיית ...") גם אחרי חזרה
  const [lastFolder, setLastFolder] = useState(null);
  // תמונת מוצר להגדלה (לייטבוקס); null = סגור
  const [zoomImage, setZoomImage] = useState(null);
  // פרטי התשלום של הספק אינם מוצגים לוועד עד שלוחצים "תשלום לספק" (רק אז נחשפים)
  const [showPay, setShowPay] = useState(false);
  // אמצעי התשלום שנבחר (מציג את פרטיו) + חשיפת פרטי החשבון (מיסוך עם עין)
  const [payMethod, setPayMethod] = useState(null);
  const [revealAccount, setRevealAccount] = useState(false);
  const folders = groupByFolder(vendor.products || []);
  // שם הגן — נכנס להודעת "בקשת הצעת מחיר" כדי שהפנייה תהיה ליד מזוהה
  const ganName = getOnboarding()?.ganName || "";
  // אמצעי התשלום הזמינים — מוצגים לוועד כאייקונים ממותגים (רק מה שהספק מילא)
  const payMethods = [
    vendor.paymentBit && { key: "bit", label: "ביט", brand: "bit", value: vendor.paymentBit },
    vendor.paymentPaybox && { key: "paybox", label: "פייבוקס", brand: "paybox", value: vendor.paymentPaybox },
    vendor.paymentLink && { key: "card", label: "אשראי", icon: "💳", value: vendor.paymentLink },
    vendor.paymentBankInfo && { key: "bank", label: "העברה בנקאית", icon: "🏦", value: vendor.paymentBankInfo },
  ].filter(Boolean);
  const hasPayInfo = payMethods.length > 0;
  // מספר התשלומים שהספק מאפשר (0/1 = תשלום אחד; גדול מ-1 = ניתן לפרוס)
  const installments = Number(vendor.paymentInstallments) || 0;

  // ── תצוגת תיקייה פתוחה: מוצרים + וואטסאפ עם הודעה מוכנה ──
  if (openFolder) {
    const waHref = whatsappUrlWithText(vendor.whatsApp, supplierMessage(openFolder.name));
    return (
      <div className="vendor-panel">
        <button
          type="button"
          className="vendor-panel__back"
          onClick={() => setOpenFolder(null)}
        >
          → חזרה לתיקיות
        </button>
        <h3 className="vendor-panel__folder-title">
          <Icon name="folder" size={18} /> {openFolder.name}
        </h3>

        {waHref && (
          <a
            className="btn btn--secondary vendor-panel__wa"
            href={waHref}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon color="#25d366" size={18} /> WhatsApp
          </a>
        )}

        <ul className="vendor-panel__products">
          {openFolder.products.map((product, index) => (
            <li key={index} className="vendor-panel__product">
              {product.imageUrl && (
                <img
                  className="vendor-panel__image"
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  onClick={() => setZoomImage(product.imageUrl)}
                  style={{ cursor: "zoom-in" }}
                />
              )}
              <div
                className="vendor-panel__product-name"
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <span>{product.name}</span>
                {product.description && (
                  <span
                    style={{ fontSize: 13, color: "#8a7d84", lineHeight: 1.35 }}
                  >
                    {product.description}
                  </span>
                )}
              </div>
              <span className="vendor-panel__price">
                {formatShekels(product.price)}
              </span>
            </li>
          ))}
        </ul>

        {zoomImage && (
          <div
            onClick={() => setZoomImage(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 16,
              cursor: "zoom-out",
            }}
          >
            <button
              type="button"
              aria-label="סגירת התמונה"
              onClick={() => setZoomImage(null)}
              style={{
                position: "absolute",
                top: 16,
                insetInlineEnd: 16,
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "2px solid #fff",
                background: "rgba(0, 0, 0, 0.55)",
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
            <img
              src={zoomImage}
              alt="תמונת המוצר בהגדלה"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: 12,
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // ── רשימת התיקיות (רמה ראשונה) ──
  const whatsapp = whatsappUrlWithText(vendor.whatsApp, supplierMessage(null));
  return (
    <div className="vendor-panel">
      {(vendor.category || vendor.city) && (
        <p className="vendor-panel__meta">
          {vendor.category}
          {vendor.category && vendor.city ? " · " : ""}
          {vendor.city}
        </p>
      )}
      {vendor.offer && (
        <div
          style={{
            background: "#fff6e0",
            border: "1px solid #f0d488",
            borderRadius: "var(--radius-md)",
            padding: "8px 12px",
            margin: "0 0 12px",
            fontWeight: 600,
            color: "#8a6d1a",
          }}
        >
          🏷️ {vendor.offer}
        </div>
      )}
      <div className="vendor-panel__contact">
        {vendor.whatsApp && (
          <a
            className="btn btn--primary"
            href={whatsappUrlWithText(
              vendor.whatsApp,
              quoteRequestMessage(vendor.name, ganName)
            )}
            target="_blank"
            rel="noreferrer"
            onClick={() => !readOnly && recordLead(vendor.id)}
          >
            <Icon name="message" size={16} /> בקשת הצעת מחיר
          </a>
        )}
        {whatsapp && (
          <a
            className="btn btn--secondary vendor-panel__wa"
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon color="#25d366" size={18} /> WhatsApp
          </a>
        )}
        {vendor.catalogUrl && (
          <a
            className="vendor-panel__catalog"
            href={vendor.catalogUrl}
            target="_blank"
            rel="noreferrer"
          >
            📖 לקטלוג
          </a>
        )}
      </div>

      {hasPayInfo && (
        <div
          className="vendor-panel__pay"
          style={{ background: "none", padding: 0 }}
        >
          {/* פרטי התשלום מוסתרים כברירת מחדל — נחשפים רק כשהוועד רוצה לשלם */}
          {hasPayInfo &&
            (!showPay ? (
              <button
                type="button"
                className="btn btn--primary vendor-panel__pay-cta"
                onClick={() => setShowPay(true)}
              >
                <Icon name="card" size={16} /> תשלום לספק
              </button>
            ) : (
              <div className="vendor-panel__pay-open">
                <p className="vendor-panel__pay-title">אפשרויות תשלום לספק</p>
                {installments > 1 && (
                  <p className="vendor-panel__pay-installments">
                    ניתן לפרוס עד {installments} תשלומים
                  </p>
                )}

                {/* אייקוני אמצעי התשלום — קטנים וממותגים, כמו בדף הבית. ביט נפתח
                    ישירות; פייבוקס/אשראי/בנק פותחים את הפרטים בלחיצה. */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {payMethods.map((m) => {
                    // ביט: פותח וואטסאפ של מספר הביט עם הודעת התעניינות (כולל
                    // התיקייה שגלשו בה). אם הספק שם קישור ביט — פותחים אותו ישירות.
                    if (m.key === "bit") {
                      const href = isPayUrl(m.value)
                        ? m.value
                        : whatsappUrlWithText(m.value, bitMessage(lastFolder));
                      return (
                        <a
                          key={m.key}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          style={payChipStyle(false)}
                        >
                          <PayBrandMark method={m} /> <span>{m.label}</span>
                        </a>
                      );
                    }
                    return (
                      <button
                        key={m.key}
                        type="button"
                        aria-expanded={payMethod === m.key}
                        onClick={() => {
                          setPayMethod(payMethod === m.key ? null : m.key);
                          setRevealAccount(false);
                        }}
                        style={payChipStyle(payMethod === m.key)}
                      >
                        <PayBrandMark method={m} /> <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* פרטי האמצעי שנבחר */}
                {(() => {
                  const m = payMethods.find((x) => x.key === payMethod);
                  if (!m) return null;
                  return (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        background: "var(--color-surface)",
                      }}
                    >
                      {m.key === "card" && (
                        <a
                          className="btn btn--primary vendor-panel__pay-cta"
                          href={m.value}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Icon name="card" size={16} /> מעבר לתשלום מאובטח
                        </a>
                      )}
                      {m.key === "paybox" &&
                        (isPayUrl(m.value) ? (
                          <a
                            className="btn btn--primary vendor-panel__pay-cta"
                            href={m.value}
                            target="_blank"
                            rel="noreferrer"
                          >
                            פתיחת payBox
                          </a>
                        ) : (
                          <p className="vendor-panel__pay-row">
                            מספר payBox: <strong dir="ltr">{m.value}</strong>
                          </p>
                        ))}
                      {m.key === "bank" && (
                        <div>
                          <p
                            className="vendor-panel__pay-row"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span>פרטי חשבון:</span>
                            {revealAccount ? (
                              <strong>{m.value}</strong>
                            ) : (
                              <strong dir="ltr" aria-hidden="true">
                                •••• •••• ••••
                              </strong>
                            )}
                            <button
                              type="button"
                              onClick={() => setRevealAccount((v) => !v)}
                              aria-label={
                                revealAccount
                                  ? "הסתרת פרטי החשבון"
                                  : "הצגת פרטי החשבון"
                              }
                              style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                fontSize: 18,
                                lineHeight: 1,
                                padding: 4,
                              }}
                            >
                              {revealAccount ? "🙈" : "👁"}
                            </button>
                          </p>
                          {!revealAccount && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                color: "#8a7d84",
                              }}
                            >
                              לחצו על העין כדי להציג את פרטי החשבון.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          {paidTotal > 0 && (
            <p className="vendor-panel__pay-row">
              שולם לספק זה עד כה: <strong>{formatShekels(paidTotal)}</strong>
            </p>
          )}
        </div>
      )}

      {vendor.socialLinks && vendor.socialLinks.length > 0 && (
        <div className="vendor-panel__socials">
          {vendor.socialLinks.map((link, index) => (
            <a
              key={index}
              className="vendor-panel__social"
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label || "קישור"}
            </a>
          ))}
        </div>
      )}

      {folders.length > 0 ? (
        <ul className="vendor-folders">
          {folders.map((f) => (
            <li key={f.name}>
              <button
                type="button"
                className="vendor-folders__item"
                onClick={() => {
                  setOpenFolder(f);
                  setLastFolder(f.name);
                }}
              >
                <span className="vendor-folders__icon" aria-hidden="true">
                  <Icon name="folder" size={18} />
                </span>
                <span className="vendor-folders__name">{f.name}</span>
                <span className="vendor-folders__count">
                  {f.products.length} מוצרים
                </span>
                <span className="vendor-folders__chevron" aria-hidden="true">
                  ‹
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="📦" message="עדיין אין מוצרים לספק הזה." />
      )}

      {/* בקשת מחיקת חשבון מהספק — לאישור/דחייה ע"י המנהלת */}
      {!readOnly && (onApproveDelete || onDismissDelete) && (
        <div
          className="vendor-panel__admin"
          style={{
            background: "#fdecea",
            border: "1px solid #f5b7b1",
            borderRadius: "var(--radius-md)",
            padding: 12,
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#c0392b" }}>
            🗑️ הספק ביקש למחוק את החשבון
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {onApproveDelete && (
              <button
                type="button"
                className="vendor-panel__edit"
                style={{ color: "#c0392b" }}
                onClick={onApproveDelete}
              >
                <Icon name="trash" size={16} /> אישור מחיקה
              </button>
            )}
            {onDismissDelete && (
              <button
                type="button"
                className="vendor-panel__share"
                onClick={onDismissDelete}
              >
                ביטול הבקשה
              </button>
            )}
          </div>
        </div>
      )}

      {/* ניהול הספק — רק לבעלת האפליקציה (SuperAdmin); וועד רגיל רק צופה */}
      {!readOnly && (onEdit || onShareEditLink) && (
        <div className="vendor-panel__admin">
          {onEdit && (
            <button type="button" className="vendor-panel__edit" onClick={onEdit}>
              <Icon name="pencil" size={16} /> עריכת פרטי הספק
            </button>
          )}
          {onShareEditLink && (
            <button
              type="button"
              className="vendor-panel__share"
              onClick={onShareEditLink}
            >
              <Icon name="link" size={16} /> שליחת קישור עריכה לספק
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default VendorPanel;
