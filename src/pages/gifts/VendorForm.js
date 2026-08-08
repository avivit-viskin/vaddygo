import { useState, useEffect } from "react";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import Input from "../../components/Input";
import Select from "../../components/Select";
import { FOLDER_PRESETS } from "../../services/vendorFolders";
import { VENDOR_CATEGORIES } from "../../services/vendorCategories";
import { fileToResizedDataUrl } from "../../services/imageUpload";
import {
  parseProductFile,
  extractPdfText,
  PRODUCTS_IMPORT_TEMPLATE,
} from "../../services/productsImport";
import {
  extractProductsFromText,
  extractProductsFromImage,
} from "../../services/vendorsService";
import {
  startImportJob,
  subscribeImportJob,
  consumeImportJob,
} from "../../services/importJobs";
import "../../styles/supplier-app.css";

/* תבנית להורדה כקובץ CSV (data-URI) — נפתח באקסל עם עברית תקינה (BOM) */
const TEMPLATE_HREF =
  "data:text/csv;charset=utf-8," + encodeURIComponent(PRODUCTS_IMPORT_TEMPLATE);

// צלע מינימלית מומלצת לתמונת מוצר; מתחתיה מסמנים "רזולוציה נמוכה" (דורש טיפול).
const MIN_GOOD_DIMENSION = 350;
// וקטור (SVG) — חד בכל גודל, ולכן לא נבדק לרזולוציה נמוכה (naturalWidth שלו לא אמין)
const isVectorSrc = (s) => /^data:image\/svg|\.svg(\?|#|$)/i.test(s || "");

/* תמונה ממוזערת של מוצר בטופס — עם סימן קריאה לחיץ אם הרזולוציה נמוכה. הלחיצה
   פותחת הודעה עם המלצת הגודל, ומדווחת להורה (onLowRes) כדי לספור "דורש טיפול". */
function VendorThumb({ src, alt, onLowRes }) {
  const [lowQuality, setLowQuality] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <img
        className="vendor-form__thumb"
        src={src}
        alt={alt}
        onLoad={(e) => {
          if (isVectorSrc(src)) return;
          const w = e.target.naturalWidth;
          const h = e.target.naturalHeight;
          if (w && h && Math.min(w, h) < MIN_GOOD_DIMENSION) {
            setLowQuality(true);
            onLowRes && onLowRes();
          }
        }}
      />
      {lowQuality && (
        <>
          <button
            type="button"
            onClick={() => setShowMsg((v) => !v)}
            aria-label="בעיית איכות תמונה — לחצו לפרטים"
            style={{
              position: "absolute",
              top: 4,
              insetInlineEnd: 4,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#f39c12",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              cursor: "pointer",
              border: "none",
              padding: 0,
            }}
          >
            !
          </button>
          {showMsg && (
            <div
              role="status"
              style={{
                position: "absolute",
                top: 28,
                insetInlineEnd: 0,
                width: 200,
                maxWidth: "80vw",
                background: "#fff",
                color: "#3a2f35",
                border: "1px solid #f0e0e8",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
                lineHeight: 1.4,
                boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                zIndex: 30,
                textAlign: "start",
              }}
            >
              התמונה ברזולוציה לא טובה. ההמלצה: תמונה בגודל{" "}
              <strong>600×600</strong> לפחות.
            </div>
          )}
        </>
      )}
    </span>
  );
}

/*
  VendorForm — הוספה/עריכה של ספק (UI_SPEC ס' 12). ספקים מנוהלים ידנית ע"י
  מנהלת VaddyGo (ערוץ הכנסה). לכל ספק: שם, קישור לקטלוג, וואטסאפ, מוצרים
  (שם + מחיר + תמונה + תיקייה/חג) וקישורים לרשתות חברתיות.
*/
function VendorForm({
  vendor,
  onSave,
  onCancel,
  hidePayments = false,
  hideSocials = false,
  hideBusinessDetails = false,
  hideProducts = false,
  initialFolder = "",
  initialStatus = "",
  showFab = false,
}) {
  const [name, setName] = useState(vendor?.name || "");
  const [catalogUrl, setCatalogUrl] = useState(vendor?.catalogUrl || "");
  const [whatsApp, setWhatsApp] = useState(vendor?.whatsApp || "");
  // קטגוריה: אם הערך השמור אינו אחת מברירות-המחדל (וגם לא "אחר") — זו קטגוריה
  // חופשית שהוקלדה, אז בוחרים "אחר" ומראים שדה הקלדה עם הערך.
  const savedCat = vendor?.category || "";
  const isPresetCat =
    savedCat !== "" && savedCat !== "אחר" && VENDOR_CATEGORIES.includes(savedCat);
  const [category, setCategory] = useState(
    savedCat === "" ? "" : isPresetCat ? savedCat : "אחר"
  );
  const [customCategory, setCustomCategory] = useState(
    savedCat && !isPresetCat && savedCat !== "אחר" ? savedCat : ""
  );
  const [city, setCity] = useState(vendor?.city || "");
  const [paymentLink, setPaymentLink] = useState(vendor?.paymentLink || "");
  const [paymentBit, setPaymentBit] = useState(vendor?.paymentBit || "");
  const [paymentBankInfo, setPaymentBankInfo] = useState(
    vendor?.paymentBankInfo || ""
  );
  const [paymentInstallments, setPaymentInstallments] = useState(
    vendor?.paymentInstallments || 0
  );
  const [products, setProducts] = useState(vendor?.products || []);
  const [socialLinks, setSocialLinks] = useState(vendor?.socialLinks || []);
  // srcs של תמונות שזוהו כרזולוציה נמוכה — נכללות בסינון "דורש טיפול"
  const [lowResSrcs, setLowResSrcs] = useState(() => new Set());
  const markLowRes = (src) =>
    setLowResSrcs((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  // סינון המוצרים לפי תיקייה (קטגוריה) בעריכה — כדי לא לגלול מוצר-מוצר. "" = הכל.
  const [folderFilter, setFolderFilter] = useState(initialFolder || "");
  // סינון לפי סטטוס מוכנות: "" = הכל, "ready" = מוכנים, "attention" = דורש טיפול.
  // מגיע מלחיצה על אריח בדאשבורד (מוכנים / דורש טיפול).
  const [statusFilter, setStatusFilter] = useState(initialStatus || "");
  // בחירה מרובה למחיקה/העברה קבוצתית — קבוצת אינדקסים של מוצרים שסומנו.
  const [selected, setSelected] = useState(() => new Set());
  // תפריט כפתור ההוספה הצף (＋): צילום מוצר / בחירה מהתמונות / הזנה ידנית.
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  // אילו מוצרים "פתוחים" לעריכה (אקורדיון) — כברירת מחדל כולם מקופלים, כדי שלא
  // תהיה רשימה ארוכה. פעולות שמזיזות אינדקסים (הוספה/מחיקה/סידור) מאפסות.
  const [openProducts, setOpenProducts] = useState(() => new Set());
  const toggleProduct = (index) =>
    setOpenProducts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState("");
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceTarget, setPriceTarget] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  function updateItem(setter, index, patch) {
    setter((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeItem(setter, index) {
    setter((prev) => prev.filter((_, i) => i !== index));
    // שינוי מבנה הרשימה מזיז אינדקסים — מנקים בחירה ואקורדיון כדי שלא יתבלבלו
    if (setter === setProducts) {
      setSelected(new Set());
      setOpenProducts(new Set());
    }
  }

  // שכפול פריט — מוסיף עותק מיד אחרי המקור, כדי להוסיף מוצרים דומים במהירות
  function duplicateItem(setter, index) {
    setter((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { ...prev[index] });
      return next;
    });
    if (setter === setProducts) {
      setSelected(new Set());
      setOpenProducts(new Set());
    }
  }

  // החלפת שני פריטים במקומם (לפי אינדקסים בפועל) — לסידור, גם בתצוגה מסוננת
  function swapItems(setter, indexA, indexB) {
    setter((prev) => {
      if (indexB == null || indexB < 0 || indexB >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
      return next;
    });
    if (setter === setProducts) {
      setSelected(new Set());
      setOpenProducts(new Set());
    }
  }

  // ── בחירה מרובה: סימון מוצר, סימון הכל (בתצוגה הנוכחית), מחיקה והעברה ──
  function toggleSelected(index) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelected((prev) => {
      const idx = visibleProducts.map(({ index }) => index);
      const allSel = idx.length > 0 && idx.every((i) => prev.has(i));
      const next = new Set(prev);
      idx.forEach((i) => (allSel ? next.delete(i) : next.add(i)));
      return next;
    });
  }

  function deleteSelected() {
    if (selected.size === 0) {
      return;
    }
    const ok = window.confirm(
      `למחוק את ${selected.size} המוצרים שסומנו? המחיקה תיכנס לתוקף בשמירה.`
    );
    if (!ok) {
      return;
    }
    setProducts((prev) => prev.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
    setOpenProducts(new Set());
    setMoveOpen(false);
    setPriceOpen(false);
  }

  // העברת כל הנבחרים לתיקייה (או "כללי" = בלי תיקייה). משמש גם לשינוי שם תיקייה:
  // בוחרים את כל התיקייה ומעבירים לשם חדש.
  function moveSelectedToFolder(folder) {
    const f = (folder || "").trim();
    const normalized = f === "כללי" ? "" : f;
    setProducts((prev) =>
      prev.map((p, i) => (selected.has(i) ? { ...p, folder: normalized } : p))
    );
    setSelected(new Set());
    setMoveOpen(false);
    setMoveTarget("");
  }

  // קביעת מחיר אחיד לכל הנבחרים בבת אחת
  function setPriceForSelected(price) {
    if (price === "" || !(Number(price) >= 0)) {
      return;
    }
    const n = Number(price);
    setProducts((prev) =>
      prev.map((p, i) => (selected.has(i) ? { ...p, price: n } : p))
    );
    setSelected(new Set());
    setPriceOpen(false);
    setPriceTarget("");
  }

  // מוצר חדש ריק — לתיקייה המסוננת כרגע (אם נבחרה)
  function blankProduct(imageUrl = "") {
    return {
      name: "",
      description: "",
      price: "",
      imageUrl,
      folder: folderFilter && folderFilter !== "כללי" ? folderFilter : "",
    };
  }

  // הוספת מוצר חדש — נכנס בראש הרשימה כדי שיהיה המוצר הראשון שרואים (ולא למטה),
  // ופתוח לעריכה מיד. מנקים סימונים כי האינדקסים "זזים" קדימה בהוספה בראש.
  function addProduct() {
    setSelected(new Set());
    setOpenProducts(new Set([0]));
    setProducts((prev) => [blankProduct(), ...prev]);
  }

  // הוספת מוצר מתוך תמונה שצולמה/נבחרה — יוצרים מוצר חדש בראש הרשימה עם התמונה.
  async function addProductWithImage(file) {
    if (!file) {
      return;
    }
    let imageUrl = "";
    try {
      imageUrl = await fileToResizedDataUrl(file);
    } catch {
      // אם ההמרה נכשלה — מוסיפים מוצר בלי תמונה; אפשר להוסיף תמונה בעריכה
    }
    setSelected(new Set());
    setOpenProducts(new Set([0]));
    setProducts((prev) => [blankProduct(imageUrl), ...prev]);
  }

  // תמונה שנבחרה מהטלפון (ספרייה/קבצים) — מכווצים ושומרים כתמונה מוטמעת במוצר
  async function handleProductImage(index, file) {
    if (!file) {
      return;
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      updateItem(setProducts, index, { imageUrl: dataUrl });
    } catch {
      // אם ההמרה נכשלה — משאירים כפי שהיה; אפשר לנסות תמונה אחרת
    }
  }

  // ממפה מוצר שיובא (מ-AI/קובץ) לצורת המוצר בטופס
  function mapImported(p) {
    return {
      name: p.name,
      description: p.description || "",
      price: p.price,
      imageUrl: p.imageUrl || "",
      folder: "",
    };
  }

  // מוסיף את המוצרים שיובאו לראש הרשימה + הודעת סיכום (כדי שיראו אותם מיד)
  function addImported(list) {
    setSelected(new Set());
    setOpenProducts(new Set());
    setProducts((prev) => [...list.map(mapImported), ...prev]);
    setImportMsg(
      `נוספו ${list.length} מוצרים ✓ — עברו לבדוק, להוסיף תמונות וללחוץ שמירה`
    );
  }

  // ייבוא מקובץ (Excel / CSV / PDF) כמשימת רקע — אפשר להמשיך לעבוד בזמן שזה רץ.
  // ל-PDF מחלצים טקסט ושולחים ל-AI. התוצאה מתווספת לרשימה לבדיקה לפני שמירה.
  function beginFileImport(file) {
    if (!file) {
      return;
    }
    const isPdf = (file.name || "").toLowerCase().endsWith(".pdf");
    startImportJob(vendor?.id, {
      loadingMessage: isPdf
        ? "המערכת עובדת קשה לחלץ את המוצרים מתוך ה-PDF 💪 אפשר להמשיך לעבוד — נודיע כשמוכן 🙂"
        : "מייבא מוצרים מהקובץ...",
      extract: async () => {
        if (isPdf) {
          const text = await extractPdfText(file);
          return extractProductsFromText(text);
        }
        return parseProductFile(file);
      },
    });
  }

  // ייבוא מצילום קטלוג כמשימת רקע — ה-AI "רואה" את התמונה וקורא ממנה את המוצרים.
  function beginPhotoImport(file) {
    if (!file) {
      return;
    }
    startImportJob(vendor?.id, {
      loadingMessage:
        "המערכת עובדת קשה לקרוא את הקטלוג מהתמונה 💪 אפשר להמשיך לעבוד — נודיע כשמוכן 🙂",
      extract: async () => {
        const dataUrl = await fileToResizedDataUrl(file, 1600, 0.82);
        const comma = dataUrl.indexOf(",");
        const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
        const m = dataUrl.match(/^data:(.*?);base64/);
        const mimeType = m ? m[1] : "image/jpeg";
        return extractProductsFromImage(base64, mimeType);
      },
    });
  }

  // מאזין למשימת הייבוא: מציג התקדמות, ומוסיף את המוצרים כשהחילוץ מסתיים — גם
  // אם הטופס נטען מחדש אחרי מעבר בין טאבים (המשימה חיה ברמת המודול, לא ברכיב).
  useEffect(() => {
    const done = consumeImportJob(vendor?.id);
    if (done && done.length) {
      addImported(done);
    }
    return subscribeImportJob((current) => {
      if (!current || current.key !== vendor?.id) {
        return;
      }
      if (current.status === "loading") {
        setImportMsg(current.message);
      } else if (current.status === "done") {
        const products = consumeImportJob(vendor?.id);
        if (products && products.length) {
          addImported(products);
        }
      } else {
        setImportMsg(current.message);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError("צריך למלא שם ספק");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        catalogUrl: catalogUrl.trim(),
        whatsApp: whatsApp.trim(),
        category: (category === "אחר" ? customCategory : category).trim(),
        city: city.trim(),
        paymentLink: paymentLink.trim(),
        paymentBit: paymentBit.trim(),
        paymentBankInfo: paymentBankInfo.trim(),
        paymentInstallments: Number(paymentInstallments) || 0,
        products: products
          .filter((product) => product.name.trim())
          .map((product) => ({
            name: product.name.trim(),
            description: (product.description || "").trim(),
            price: Number(product.price) || 0,
            imageUrl: (product.imageUrl || "").trim(),
            folder: (product.folder || "").trim(),
          })),
        socialLinks: socialLinks
          .filter((link) => (link.url || "").trim())
          .map((link) => ({
            label: (link.label || "").trim(),
            url: link.url.trim(),
          })),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── סינון מוצרים לפי תיקייה (קטגוריה) בעריכה ──
  function inFolder(product, filter) {
    if (!filter) return true;
    const f = (product.folder || "").trim();
    if (filter === "כללי") return f === "" || f === "כללי";
    return f === filter;
  }
  // מוצר "דורש טיפול" = בלי מחיר, בלי תמונה, או תמונה ברזולוציה נמוכה. מוכן = ההפך.
  function matchesStatus(product, status) {
    if (!status) return true;
    const missing =
      !(Number(product.price) > 0) || !(product.imageUrl || "").trim();
    const lowRes = !!(product.imageUrl && lowResSrcs.has(product.imageUrl));
    const attention = missing || lowRes;
    return status === "attention" ? attention : !attention;
  }
  const usedFolders = [
    ...FOLDER_PRESETS.filter((f) =>
      products.some((p) => (p.folder || "").trim() === f)
    ),
    ...[
      ...new Set(
        products
          .map((p) => (p.folder || "").trim())
          .filter((f) => f && !FOLDER_PRESETS.includes(f))
      ),
    ].sort(),
  ];
  const hasUncategorized = products.some((p) => !(p.folder || "").trim());
  const folderChips = [...usedFolders, ...(hasUncategorized ? ["כללי"] : [])];
  const visibleProducts = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => inFolder(product, folderFilter))
    .filter(({ product }) => matchesStatus(product, statusFilter));
  const visibleIndices = visibleProducts.map(({ index }) => index);
  const allVisibleSelected =
    visibleIndices.length > 0 && visibleIndices.every((i) => selected.has(i));
  const chipStyle = (active) => ({
    flexShrink: 0,
    border: active
      ? "1px solid var(--color-primary-dark)"
      : "1px solid var(--color-border)",
    background: active ? "var(--color-primary-light)" : "var(--color-surface)",
    color: active ? "var(--color-primary-dark)" : "var(--color-text)",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: "var(--font-size-sm)",
    fontFamily: "var(--font-family)",
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      {!hideBusinessDetails && (
        <>
      <div className="sup-card">
        <h3 className="sup-card__title">🏢 פרטי העסק</h3>
        <Input
          id="vendor-name"
          label="🏢 שם העסק"
          value={name}
          error={nameError}
          onChange={(e) => {
            setName(e.target.value);
            setNameError("");
          }}
          placeholder="למשל: מתנות בלב"
        />
        <Input
          id="vendor-whatsapp"
          label="📱 וואטסאפ (מספר או קישור)"
          value={whatsApp}
          onChange={(e) => setWhatsApp(e.target.value)}
          placeholder="למשל: 054-1234567"
        />
        <Select
          id="vendor-category"
          label="🏷️ קטגוריה (לגילוי ע״י ועדים)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">— בחירת קטגוריה —</option>
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        {category === "אחר" && (
          <Input
            id="vendor-category-custom"
            label="פירוט הקטגוריה (איזה סוג מוצרים)"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="הקלידו את סוג המוצרים"
          />
        )}
      </div>

      <div className="sup-card">
        <h3 className="sup-card__title">🌍 מידע נוסף</h3>
        <Input
          id="vendor-city"
          label="🌍 עיר / אזור פעילות (אופציונלי)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="למשל: תל אביב והמרכז"
        />
        <Input
          id="vendor-catalog"
          label="🔗 קישור לקטלוג (אופציונלי)"
          type="url"
          value={catalogUrl}
          onChange={(e) => setCatalogUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
        </>
      )}

      {!hidePayments && (
        <>
          <p className="vendor-form__products-title">אמצעי תשלום (לא חובה)</p>
          <Input
            id="vendor-pay-link"
            label="קישור תשלום (GROW / פייבוקס / כל קישור)"
            type="url"
            value={paymentLink}
            onChange={(e) => setPaymentLink(e.target.value)}
            placeholder="https://..."
          />
          <Input
            id="vendor-pay-bit"
            label="ביט (מספר טלפון)"
            value={paymentBit}
            onChange={(e) => setPaymentBit(e.target.value)}
            placeholder="למשל: 054-1234567"
          />
          <Input
            id="vendor-pay-bank"
            label="פרטי העברה בנקאית"
            value={paymentBankInfo}
            onChange={(e) => setPaymentBankInfo(e.target.value)}
            placeholder="בנק · סניף · חשבון · שם המוטב"
          />
          <Select
            id="vendor-pay-installments"
            label="פריסה לתשלומים (כמה תשלומים מותר לוועד)"
            value={paymentInstallments}
            onChange={(e) => setPaymentInstallments(e.target.value)}
          >
            <option value={0}>תשלום אחד (בלי פריסה)</option>
            {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                עד {n} תשלומים
              </option>
            ))}
          </Select>
        </>
      )}

      {!hideProducts && (
        <>
      <p className="vendor-form__products-title">מוצרים</p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        {/* הוספת מוצר — כפתור ראשי בשורה, ליד "צילום קטלוג". פותח תפריט:
            צילום / גלריה / הזנה ידנית (החליף את הכפתור הצף לבקשת בעלת המוצר). */}
        {showFab && (
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="vendor-form__upload"
              aria-haspopup="true"
              aria-expanded={addMenuOpen}
              onClick={() => setAddMenuOpen((v) => !v)}
            >
              ＋ הוספת מוצר ▾
            </button>
            {addMenuOpen && (
              <>
                {/* רקע שקוף — לחיצה מחוץ לתפריט סוגרת אותו */}
                <button
                  type="button"
                  aria-label="סגירת התפריט"
                  onClick={() => setAddMenuOpen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "transparent",
                    border: "none",
                    zIndex: 40,
                    cursor: "default",
                  }}
                />
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    insetInlineStart: 0,
                    zIndex: 41,
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    padding: 6,
                    minWidth: 210,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <label role="menuitem" className="sup-fab-menu__item">
                    <span className="sup-fab-menu__emoji" aria-hidden="true">
                      📷
                    </span>{" "}
                    צילום מוצר
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="vendor-form__file"
                      aria-label="צילום מוצר חדש"
                      onChange={(e) => {
                        addProductWithImage(e.target.files && e.target.files[0]);
                        setAddMenuOpen(false);
                      }}
                    />
                  </label>
                  <label role="menuitem" className="sup-fab-menu__item">
                    <span className="sup-fab-menu__emoji" aria-hidden="true">
                      🖼️
                    </span>{" "}
                    מהתמונות / קבצים
                    <input
                      type="file"
                      accept="image/*"
                      className="vendor-form__file"
                      aria-label="בחירת תמונת מוצר מהמכשיר"
                      onChange={(e) => {
                        addProductWithImage(e.target.files && e.target.files[0]);
                        setAddMenuOpen(false);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    role="menuitem"
                    className="sup-fab-menu__item"
                    onClick={() => {
                      addProduct();
                      setAddMenuOpen(false);
                    }}
                  >
                    <span className="sup-fab-menu__emoji" aria-hidden="true">
                      ✏️
                    </span>{" "}
                    הזנה ידנית (מוצר ריק)
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {/* "צילום קטלוג" מוצג רק בעריכת המנהלת (בלי showFab). בפורטל הספק הוסר
            לבקשת בעלת המוצר — שם כבר יש "הוספת מוצר ▾ → צילום מוצר". */}
        {!showFab && (
          <label className="vendor-form__upload">
            <Icon name="image" size={16} /> צילום קטלוג
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="vendor-form__file"
              aria-label="צילום קטלוג לזיהוי מוצרים"
              onChange={(e) =>
                beginPhotoImport(e.target.files && e.target.files[0])
              }
            />
          </label>
        )}
        <label className="vendor-form__upload">
          <Icon name="folder" size={16} /> ייבוא מקובץ (Excel / CSV / PDF)
          <input
            type="file"
            accept=".csv,.txt,.xlsx,.xls,.pdf"
            className="vendor-form__file"
            aria-label="ייבוא מוצרים מקובץ"
            onChange={(e) =>
              beginFileImport(e.target.files && e.target.files[0])
            }
          />
        </label>
        <a
          style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}
          href={TEMPLATE_HREF}
          download="מוצרים-תבנית.csv"
        >
          הורדת תבנית
        </a>
        {importMsg && (
          <span
            style={{
              flexBasis: "100%",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-success)",
            }}
          >
            {importMsg}
          </span>
        )}
      </div>
      {folderChips.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={() => setFolderFilter("")}
            style={chipStyle(folderFilter === "")}
          >
            הכל ({products.length})
          </button>
          {folderChips.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFolderFilter(f)}
              style={chipStyle(folderFilter === f)}
            >
              {f}
            </button>
          ))}
        </div>
      )}
      {statusFilter && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            background:
              statusFilter === "attention" ? "#fdf1e7" : "#eafaf1",
            border: `1px solid ${
              statusFilter === "attention" ? "#f0c9a3" : "#b7e6cd"
            }`,
            borderRadius: 12,
            padding: "8px 12px",
            margin: "0 0 12px",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: statusFilter === "attention" ? "#c05a17" : "#1d8a55",
          }}
        >
          <span>
            מציג רק:{" "}
            {statusFilter === "attention"
              ? "מוצרים שדורשים טיפול ⚠️"
              : "מוצרים מוכנים ✅"}
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            style={{
              marginInlineStart: "auto",
              border: "none",
              background: "none",
              color: "var(--color-link)",
              fontFamily: "var(--font-family)",
              fontWeight: 700,
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
            }}
          >
            הצג את כל המוצרים ✕
          </button>
        </div>
      )}
      {(folderFilter || statusFilter) && visibleProducts.length === 0 && (
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "var(--font-size-sm)",
            margin: "0 0 10px",
          }}
        >
          אין מוצרים בתצוגה הזו — אפשר להוסיף מוצר חדש למטה.
        </p>
      )}
      {visibleProducts.length >= 2 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            marginBottom: 12,
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            background: selected.size
              ? "var(--color-primary-light)"
              : "var(--color-surface)",
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
            }}
          >
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            סימון הכל{folderFilter ? " בתיקייה" : ""} ({visibleProducts.length})
          </label>

          {selected.size > 0 && (
            <>
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--color-primary-dark)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                {selected.size} נבחרו
              </span>
              <button
                type="button"
                onClick={deleteSelected}
                style={{
                  border: "1px solid #e3b7b7",
                  background: "#fdecec",
                  color: "#c0392b",
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontFamily: "var(--font-family)",
                  fontWeight: 700,
                  fontSize: "var(--font-size-sm)",
                  cursor: "pointer",
                }}
              >
                🗑️ מחיקה
              </button>
              <button
                type="button"
                onClick={() => {
                  setMoveOpen((o) => !o);
                  setPriceOpen(false);
                }}
                style={{
                  border: "1px solid var(--color-primary-dark)",
                  background: "var(--color-surface)",
                  color: "var(--color-primary-dark)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontFamily: "var(--font-family)",
                  fontWeight: 700,
                  fontSize: "var(--font-size-sm)",
                  cursor: "pointer",
                }}
              >
                📁 העברה לתיקייה
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriceOpen((o) => !o);
                  setMoveOpen(false);
                }}
                style={{
                  border: "1px solid var(--color-primary-dark)",
                  background: "var(--color-surface)",
                  color: "var(--color-primary-dark)",
                  borderRadius: 10,
                  padding: "6px 12px",
                  fontFamily: "var(--font-family)",
                  fontWeight: 700,
                  fontSize: "var(--font-size-sm)",
                  cursor: "pointer",
                }}
              >
                💰 מחיר אחיד
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelected(new Set());
                  setMoveOpen(false);
                  setPriceOpen(false);
                }}
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--color-text-muted)",
                  fontFamily: "var(--font-family)",
                  fontSize: "var(--font-size-sm)",
                  cursor: "pointer",
                }}
              >
                ביטול בחירה
              </button>
            </>
          )}

          {moveOpen && selected.size > 0 && (
            <div
              style={{
                flexBasis: "100%",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-muted)",
                }}
              >
                העברת הנבחרים ל:
              </span>
              {FOLDER_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => moveSelectedToFolder(preset)}
                  style={chipStyle(false)}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => moveSelectedToFolder("")}
                style={chipStyle(false)}
              >
                כללי (בלי תיקייה)
              </button>
              <input
                className="field__input"
                value={moveTarget}
                onChange={(e) => setMoveTarget(e.target.value)}
                placeholder="או שם תיקייה חדש"
                style={{ width: 150, flexShrink: 0 }}
              />
              <button
                type="button"
                onClick={() => moveSelectedToFolder(moveTarget)}
                disabled={!moveTarget.trim()}
                style={{
                  border: "none",
                  background: "var(--color-primary)",
                  color: "var(--color-primary-dark)",
                  borderRadius: 10,
                  padding: "6px 14px",
                  fontFamily: "var(--font-family)",
                  fontWeight: 700,
                  fontSize: "var(--font-size-sm)",
                  cursor: moveTarget.trim() ? "pointer" : "default",
                  opacity: moveTarget.trim() ? 1 : 0.5,
                }}
              >
                העברה
              </button>
            </div>
          )}

          {priceOpen && selected.size > 0 && (
            <div
              style={{
                flexBasis: "100%",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-muted)",
                }}
              >
                מחיר אחיד לכל הנבחרים (₪):
              </span>
              <input
                className="field__input"
                type="number"
                min="0"
                value={priceTarget}
                onChange={(e) => setPriceTarget(e.target.value)}
                placeholder="למשל: 50"
                style={{ width: 120, flexShrink: 0 }}
              />
              <button
                type="button"
                onClick={() => setPriceForSelected(priceTarget)}
                disabled={priceTarget === "" || Number(priceTarget) < 0}
                style={{
                  border: "none",
                  background: "var(--color-primary)",
                  color: "var(--color-primary-dark)",
                  borderRadius: 10,
                  padding: "6px 14px",
                  fontFamily: "var(--font-family)",
                  fontWeight: 700,
                  fontSize: "var(--font-size-sm)",
                  cursor:
                    priceTarget === "" || Number(priceTarget) < 0
                      ? "default"
                      : "pointer",
                  opacity:
                    priceTarget === "" || Number(priceTarget) < 0 ? 0.5 : 1,
                }}
              >
                החלת מחיר
              </button>
            </div>
          )}
        </div>
      )}
      {visibleProducts.length > 0 && (
        <div className="gift-form__actions" style={{ margin: "0 0 12px" }}>
          <Button type="submit" isLoading={isSubmitting}>
            שמירת השינויים
          </Button>
        </div>
      )}
      {visibleProducts.map(({ product, index }, vi) => {
        const isOpen = openProducts.has(index);
        const missing =
          !(Number(product.price) > 0) || !(product.imageUrl || "").trim();
        return (
        <div
          className="vendor-form__product"
          key={index}
          style={
            selected.has(index)
              ? { outline: "2px solid var(--color-primary)", outlineOffset: 2 }
              : undefined
          }
        >
          <div className="vendor-form__product-head">
            <input
              type="checkbox"
              checked={selected.has(index)}
              onChange={() => toggleSelected(index)}
              aria-label={`בחירת מוצר ${index + 1}`}
              style={{
                width: 18,
                height: 18,
                marginInlineEnd: 6,
                flexShrink: 0,
                cursor: "pointer",
              }}
            />
            <button
              type="button"
              className="vendor-form__product-toggle"
              onClick={() => toggleProduct(index)}
              aria-expanded={isOpen}
              aria-label={`${isOpen ? "סגירת" : "פתיחת"} מוצר ${index + 1}`}
            >
              <span
                className={`vendor-form__product-chevron${
                  isOpen ? " is-open" : ""
                }`}
                aria-hidden="true"
              >
                ▾
              </span>
              {product.imageUrl ? (
                <img
                  className="vendor-form__product-thumb-sm"
                  src={product.imageUrl}
                  alt=""
                />
              ) : (
                <span
                  className="vendor-form__product-thumb-sm vendor-form__product-thumb-sm--empty"
                  aria-hidden="true"
                >
                  <Icon name="image" size={14} />
                </span>
              )}
              <span className="vendor-form__product-summary">
                <span className="vendor-form__product-title-sm">
                  {(product.name || "").trim() || `מוצר ${index + 1}`}
                </span>
                <span className="vendor-form__product-meta-sm">
                  {Number(product.price) > 0 ? `${product.price} ₪` : "בלי מחיר"}
                  {missing ? " · חסר מידע ⚠️" : ""}
                </span>
              </span>
            </button>
            <button
              type="button"
              aria-label={`העברת מוצר ${index + 1} למעלה`}
              disabled={vi === 0}
              onClick={() =>
                swapItems(setProducts, index, visibleProducts[vi - 1]?.index)
              }
              style={{
                marginInlineStart: 6,
                width: 28,
                height: 28,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                borderRadius: 6,
                cursor: vi === 0 ? "default" : "pointer",
                opacity: vi === 0 ? 0.35 : 1,
                fontSize: 15,
                lineHeight: 1,
              }}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`העברת מוצר ${index + 1} למטה`}
              disabled={vi === visibleProducts.length - 1}
              onClick={() =>
                swapItems(setProducts, index, visibleProducts[vi + 1]?.index)
              }
              style={{
                marginInlineStart: 4,
                width: 28,
                height: 28,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                borderRadius: 6,
                cursor:
                  vi === visibleProducts.length - 1 ? "default" : "pointer",
                opacity: vi === visibleProducts.length - 1 ? 0.35 : 1,
                fontSize: 15,
                lineHeight: 1,
              }}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label={`שכפול מוצר ${index + 1}`}
              onClick={() => duplicateItem(setProducts, index)}
              style={{
                marginInlineStart: "auto",
                marginInlineEnd: 8,
                border: "none",
                background: "none",
                color: "var(--color-link)",
                fontFamily: "var(--font-family)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon name="copy" size={15} /> שכפול
            </button>
            <button
              type="button"
              className="vendor-form__remove"
              aria-label={`הסרת מוצר ${index + 1}`}
              onClick={() => removeItem(setProducts, index)}
            >
              ✕
            </button>
          </div>

          {isOpen && (
          <div className="vendor-form__product-body">
          <input
            className="field__input"
            aria-label={`שם מוצר ${index + 1}`}
            value={product.name}
            onChange={(e) =>
              updateItem(setProducts, index, { name: e.target.value })
            }
            placeholder="שם המוצר"
          />

          <textarea
            className="field__input"
            aria-label={`תיאור מוצר ${index + 1}`}
            value={product.description || ""}
            onChange={(e) =>
              updateItem(setProducts, index, { description: e.target.value })
            }
            placeholder="תיאור קצר (אופציונלי)"
            rows={2}
            style={{ resize: "vertical", marginBottom: 6 }}
          />

          <div className="vendor-form__row">
            <input
              className="field__input vendor-form__price"
              aria-label={`מחיר מוצר ${index + 1}`}
              type="number"
              min="0"
              value={product.price}
              onChange={(e) =>
                updateItem(setProducts, index, { price: e.target.value })
              }
              placeholder="מחיר ₪"
            />
            <input
              className="field__input vendor-form__folder"
              aria-label={`תיקייה/חג למוצר ${index + 1}`}
              list="vendor-folder-presets"
              value={product.folder || ""}
              onChange={(e) =>
                updateItem(setProducts, index, { folder: e.target.value })
              }
              placeholder="תיקייה/חג (ראש השנה, פסח...)"
            />
          </div>

          {/* קטגוריות בלחיצה — שיוך מהיר לתיקייה בלי להקליד (טוגל) */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              margin: "2px 0 6px",
            }}
          >
            {FOLDER_PRESETS.map((preset) => {
              const active = (product.folder || "") === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    updateItem(setProducts, index, {
                      folder: active ? "" : preset,
                    })
                  }
                  style={{
                    border: active
                      ? "1px solid var(--color-primary-dark)"
                      : "1px solid var(--color-border)",
                    background: active
                      ? "var(--color-primary-light)"
                      : "var(--color-surface)",
                    color: active
                      ? "var(--color-primary-dark)"
                      : "var(--color-text)",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: "var(--font-size-sm)",
                    fontFamily: "var(--font-family)",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {preset}
                </button>
              );
            })}
          </div>

          <div className="vendor-form__image">
            {product.imageUrl ? (
              <VendorThumb
                src={product.imageUrl}
                alt={`תמונת ${product.name || "המוצר"}`}
                onLowRes={() => markLowRes(product.imageUrl)}
              />
            ) : (
              <span
                className="vendor-form__thumb vendor-form__thumb--empty"
                aria-hidden="true"
              >
                <Icon name="image" size={22} />
              </span>
            )}
            <div className="vendor-form__image-controls">
              <label className="vendor-form__upload">
                <Icon name="folder" size={16} /> ייבוא קובץ
                <input
                  type="file"
                  accept="image/*"
                  className="vendor-form__file"
                  aria-label={`ייבוא תמונה למוצר ${index + 1}`}
                  onChange={(e) =>
                    handleProductImage(
                      index,
                      e.target.files && e.target.files[0]
                    )
                  }
                />
              </label>
              <span className="vendor-form__upload-hint">
                לצילום, מספריית התמונות או מהקבצים
              </span>
              {product.imageUrl && (
                <button
                  type="button"
                  className="vendor-form__img-remove"
                  onClick={() =>
                    updateItem(setProducts, index, { imageUrl: "" })
                  }
                >
                  הסרת תמונה
                </button>
              )}
            </div>
          </div>
          {/* שמירה מהירה של המוצר — שומרת את כל הכרטיס (הספק לא צריך לגלול למטה) */}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                border: "1px solid var(--color-primary-dark)",
                background: "var(--color-primary)",
                color: "var(--color-primary-dark)",
                borderRadius: 10,
                padding: "6px 14px",
                fontFamily: "var(--font-family)",
                fontWeight: 700,
                fontSize: "var(--font-size-sm)",
                cursor: isSubmitting ? "default" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              שמירה
            </button>
          </div>
          </div>
          )}
        </div>
        );
      })}
      <datalist id="vendor-folder-presets">
        {FOLDER_PRESETS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      {/* הוספת מוצר — כפתור צף (＋) באזור הספק, או כפתור רגיל בעריכת מנהלת.
          מציגים רק אחד מהם כדי לא לכפול את האופציה. לחיצה על ＋ פותחת תפריט:
          צילום מוצר / בחירה מהתמונות / הזנה ידנית. */}
      {/* בעריכת המנהלת (בלי showFab) — כפתור הוספה רגיל בתחתית. בפורטל הספק
          ההוספה עברה לשורה העליונה ליד "צילום קטלוג" (בלי הכפתור הצף). */}
      {!showFab && (
        <Button variant="secondary" onClick={addProduct}>
          + הוספת מוצר
          {folderFilter && folderFilter !== "כללי" ? ` ל${folderFilter}` : ""}
        </Button>
      )}
        </>
      )}

      {!hideSocials && (
        <>
          <p className="vendor-form__products-title">רשתות חברתיות</p>
          {socialLinks.map((link, index) => (
            <div className="vendor-form__linkrow" key={index}>
              <input
                className="field__input vendor-form__social-label"
                aria-label={`שם רשת ${index + 1}`}
                value={link.label || ""}
                onChange={(e) =>
                  updateItem(setSocialLinks, index, { label: e.target.value })
                }
                placeholder="אינסטגרם / פייסבוק..."
              />
              <input
                className="field__input"
                aria-label={`קישור רשת ${index + 1}`}
                type="url"
                value={link.url || ""}
                onChange={(e) =>
                  updateItem(setSocialLinks, index, { url: e.target.value })
                }
                placeholder="https://..."
              />
              <button
                type="button"
                className="vendor-form__remove"
                aria-label={`הסרת רשת ${index + 1}`}
                onClick={() => removeItem(setSocialLinks, index)}
              >
                ✕
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              setSocialLinks((prev) => [...prev, { label: "", url: "" }])
            }
          >
            + הוספת רשת חברתית
          </Button>
        </>
      )}

      <div className="gift-form__actions">
        <Button type="submit" isLoading={isSubmitting}>
          שמירה
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            ביטול
          </Button>
        )}
      </div>
    </form>
  );
}

export default VendorForm;
