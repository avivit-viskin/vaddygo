import { useState } from "react";
import Button from "../../components/Button";
import Input from "../../components/Input";

/*
  VendorForm — הוספה/עריכה של ספק (UI_SPEC ס' 12): שם, קישור לקטלוג,
  ורשימת מוצרים (שם + מחיר). המוצרים נערכים כרשימה דינמית עם שורות שמתווספות.
*/
function VendorForm({ vendor, onSave, onCancel }) {
  const [name, setName] = useState(vendor?.name || "");
  const [catalogUrl, setCatalogUrl] = useState(vendor?.catalogUrl || "");
  const [products, setProducts] = useState(vendor?.products || []);
  const [nameError, setNameError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateProduct(index, patch) {
    setProducts((prev) =>
      prev.map((product, i) => (i === index ? { ...product, ...patch } : product))
    );
  }

  function addProductRow() {
    setProducts((prev) => [...prev, { name: "", price: "" }]);
  }

  function removeProductRow(index) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
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
        products: products
          .filter((product) => product.name.trim())
          .map((product) => ({
            name: product.name.trim(),
            price: Number(product.price) || 0,
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
            onChange={(e) => updateProduct(index, { name: e.target.value })}
            placeholder="שם המוצר"
          />
          <input
            className="field__input vendor-form__price"
            aria-label={`מחיר מוצר ${index + 1}`}
            type="number"
            min="0"
            value={product.price}
            onChange={(e) => updateProduct(index, { price: e.target.value })}
            placeholder="₪"
          />
          <button
            type="button"
            className="vendor-form__remove"
            aria-label={`הסרת מוצר ${index + 1}`}
            onClick={() => removeProductRow(index)}
          >
            ✕
          </button>
        </div>
      ))}
      <Button variant="secondary" onClick={addProductRow}>
        + הוספת מוצר
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
