import { useState } from "react";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import Input from "../../components/Input";
import Select from "../../components/Select";
import { FOLDER_PRESETS } from "../../services/vendorFolders";
import { VENDOR_CATEGORIES } from "../../services/vendorCategories";
import { fileToResizedDataUrl } from "../../services/imageUpload";
import {
  parseProductFile,
  PRODUCTS_IMPORT_TEMPLATE,
} from "../../services/productsImport";

/* תבנית להורדה כקובץ CSV (data-URI) — נפתח באקסל עם עברית תקינה (BOM) */
const TEMPLATE_HREF =
  "data:text/csv;charset=utf-8," + encodeURIComponent(PRODUCTS_IMPORT_TEMPLATE);

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
  }

  // שכפול פריט — מוסיף עותק מיד אחרי המקור, כדי להוסיף מוצרים דומים במהירות
  function duplicateItem(setter, index) {
    setter((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { ...prev[index] });
      return next;
    });
  }

  // הזזת פריט מעלה/מטה (dir = -1/1) — לסדר את המוצרים כפי שהלקוח יראה אותם
  function moveItem(setter, index, dir) {
    setter((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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

  // ייבוא מרוכז של מוצרים מקובץ Excel/CSV — מתווספים לרשימה, והספק שומר אחר כך
  async function handleImportFile(file) {
    if (!file) {
      return;
    }
    setImportMsg("מייבא...");
    try {
      const imported = await parseProductFile(file);
      if (imported.length === 0) {
        setImportMsg("לא נמצאו מוצרים בקובץ. ודאו שיש עמודת 'שם'.");
        return;
      }
      setProducts((prev) => [
        ...prev,
        ...imported.map((p) => ({
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl || "",
          folder: "",
        })),
      ]);
      setImportMsg(`נוספו ${imported.length} מוצרים ✓ — אפשר לבדוק וללחוץ שמירה`);
    } catch {
      setImportMsg("לא הצלחנו לקרוא את הקובץ. נסו Excel או CSV.");
    }
  }

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

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Input
        id="vendor-name"
        label="שם הספק"
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
        label="וואטסאפ (מספר או קישור)"
        value={whatsApp}
        onChange={(e) => setWhatsApp(e.target.value)}
        placeholder="למשל: 054-1234567"
      />
      <Select
        id="vendor-category"
        label="קטגוריה (לגילוי ע״י ועדים)"
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
      <Input
        id="vendor-city"
        label="עיר / אזור פעילות (אופציונלי)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="למשל: תל אביב והמרכז"
      />

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
      <Input
        id="vendor-catalog"
        label="קישור לקטלוג (אופציונלי)"
        type="url"
        value={catalogUrl}
        onChange={(e) => setCatalogUrl(e.target.value)}
        placeholder="https://..."
      />

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
        <label className="vendor-form__upload">
          📥 ייבוא מקובץ (Excel/CSV)
          <input
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            className="vendor-form__file"
            aria-label="ייבוא מוצרים מקובץ"
            onChange={(e) =>
              handleImportFile(e.target.files && e.target.files[0])
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
      {products.map((product, index) => (
        <div className="vendor-form__product" key={index}>
          <div className="vendor-form__product-head">
            <span className="vendor-form__product-num">מוצר {index + 1}</span>
            <button
              type="button"
              aria-label={`העברת מוצר ${index + 1} למעלה`}
              disabled={index === 0}
              onClick={() => moveItem(setProducts, index, -1)}
              style={{
                marginInlineStart: 6,
                width: 28,
                height: 28,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                borderRadius: 6,
                cursor: index === 0 ? "default" : "pointer",
                opacity: index === 0 ? 0.35 : 1,
                fontSize: 15,
                lineHeight: 1,
              }}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`העברת מוצר ${index + 1} למטה`}
              disabled={index === products.length - 1}
              onClick={() => moveItem(setProducts, index, 1)}
              style={{
                marginInlineStart: 4,
                width: 28,
                height: 28,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                borderRadius: 6,
                cursor: index === products.length - 1 ? "default" : "pointer",
                opacity: index === products.length - 1 ? 0.35 : 1,
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

          <input
            className="field__input"
            aria-label={`שם מוצר ${index + 1}`}
            value={product.name}
            onChange={(e) =>
              updateItem(setProducts, index, { name: e.target.value })
            }
            placeholder="שם המוצר"
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
              <img
                className="vendor-form__thumb"
                src={product.imageUrl}
                alt={`תמונת ${product.name || "המוצר"}`}
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

          <input
            className="field__input vendor-form__img-url"
            type="url"
            value={
              (product.imageUrl || "").startsWith("data:")
                ? ""
                : product.imageUrl || ""
            }
            onChange={(e) =>
              updateItem(setProducts, index, { imageUrl: e.target.value })
            }
            placeholder="או קישור לתמונה (https://...)"
            aria-label={`קישור תמונה למוצר ${index + 1}`}
          />
        </div>
      ))}
      <datalist id="vendor-folder-presets">
        {FOLDER_PRESETS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      <Button
        variant="secondary"
        onClick={() =>
          setProducts((prev) => [
            ...prev,
            { name: "", price: "", imageUrl: "", folder: "" },
          ])
        }
      >
        + הוספת מוצר
      </Button>

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
