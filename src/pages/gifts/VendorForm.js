import { useState } from "react";
import Button from "../../components/Button";
import Input from "../../components/Input";

/*
  VendorForm — הוספה/עריכה של ספק (UI_SPEC ס' 12). ספקים מנוהלים ידנית ע"י
  מנהלת VaddyGo (ערוץ הכנסה). לכל ספק: שם, קישור לקטלוג, וואטסאפ, מוצרים
  (שם + מחיר + תמונה) וקישורים לרשתות חברתיות. הרשימות הדינמיות נערכות בשורות.
*/
function VendorForm({ vendor, onSave, onCancel }) {
  const [name, setName] = useState(vendor?.name || "");
  const [catalogUrl, setCatalogUrl] = useState(vendor?.catalogUrl || "");
  const [whatsApp, setWhatsApp] = useState(vendor?.whatsApp || "");
  const [products, setProducts] = useState(vendor?.products || []);
  const [socialLinks, setSocialLinks] = useState(vendor?.socialLinks || []);
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateItem(setter, index, patch) {
    setter((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeItem(setter, index) {
    setter((prev) => prev.filter((_, i) => i !== index));
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
        products: products
          .filter((product) => product.name.trim())
          .map((product) => ({
            name: product.name.trim(),
            price: Number(product.price) || 0,
            imageUrl: (product.imageUrl || "").trim(),
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
      <Input
        id="vendor-catalog"
        label="קישור לקטלוג (אופציונלי)"
        type="url"
        value={catalogUrl}
        onChange={(e) => setCatalogUrl(e.target.value)}
        placeholder="https://..."
      />

      <p className="vendor-form__products-title">מוצרים</p>
      {products.map((product, index) => (
        <div className="vendor-form__product" key={index}>
          <input
            className="field__input"
            aria-label={`שם מוצר ${index + 1}`}
            value={product.name}
            onChange={(e) =>
              updateItem(setProducts, index, { name: e.target.value })
            }
            placeholder="שם המוצר"
          />
          <input
            className="field__input vendor-form__price"
            aria-label={`מחיר מוצר ${index + 1}`}
            type="number"
            min="0"
            value={product.price}
            onChange={(e) =>
              updateItem(setProducts, index, { price: e.target.value })
            }
            placeholder="₪"
          />
          <input
            className="field__input"
            aria-label={`קישור תמונה למוצר ${index + 1}`}
            type="url"
            value={product.imageUrl || ""}
            onChange={(e) =>
              updateItem(setProducts, index, { imageUrl: e.target.value })
            }
            placeholder="קישור לתמונה (https://...)"
          />
          <button
            type="button"
            className="vendor-form__remove"
            aria-label={`הסרת מוצר ${index + 1}`}
            onClick={() => removeItem(setProducts, index)}
          >
            ✕
          </button>
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          setProducts((prev) => [...prev, { name: "", price: "", imageUrl: "" }])
        }
      >
        + הוספת מוצר
      </Button>

      <p className="vendor-form__products-title">רשתות חברתיות</p>
      {socialLinks.map((link, index) => (
        <div className="vendor-form__product" key={index}>
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

      <div className="gift-form__actions">
        <Button type="submit" isLoading={isSubmitting}>
          שמירה
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
}

export default VendorForm;
