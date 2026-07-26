import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import useApi from "../hooks/useApi";
import {
  getVendorByToken,
  updateVendorByToken,
} from "../services/vendorsService";
import VendorForm from "./gifts/VendorForm";
import Logo from "../components/Logo";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import "../styles/gifts.css";

/*
  SupplierEditPage — עמוד עריכה עצמית לספק (פורטל ספקים, שלב 1). ציבורי ובמסך
  מלא (בלי התחברות): הספק פותח את הקישור האישי שקיבל, עורך את הכרטיס והמוצרים
  שלו, וזה נשמר לאותה רשומה שהוועדים רואים ב-VaddyGo. הטוקן שבכתובת הוא ההרשאה.
*/
function SupplierEditPage() {
  const { token } = useParams();
  const fetcher = useCallback(() => getVendorByToken(token), [token]);
  const { data: vendor, isLoading, error, reload } = useApi(fetcher);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSave(payload) {
    setSaveError("");
    setSaved(false);
    try {
      await updateVendorByToken(token, payload);
      setSaved(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSaveError(err.message || "לא הצלחנו לשמור. אפשר לנסות שוב בעוד רגע.");
    }
  }

  if (isLoading) {
    return <Spinner text="טוען את כרטיס הספק..." />;
  }

  if (error) {
    return (
      <div className="supplier-edit">
        <ErrorMessage
          message="הקישור אינו תקין או שכבר אינו בתוקף. אפשר לבקש קישור חדש מהוועד."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="supplier-edit" dir="rtl">
      <div className="supplier-edit__brand">
        <Logo />
      </div>
      <h1 className="supplier-edit__title">עריכת כרטיס הספק שלך</h1>
      <p className="supplier-edit__intro">
        שלום {vendor.name || "ספק יקר"} 👋 כאן אפשר לעדכן את הפרטים והמוצרים שלך.
        כל שינוי שתשמרו יופיע <strong>מיד</strong> לוועדים ב-VaddyGo.
      </p>

      {saved && (
        <p className="supplier-edit__saved" role="status">
          ✓ הפרטים נשמרו — כבר מעודכנים אצל הוועדים
        </p>
      )}
      {saveError && (
        <p className="field__error" role="alert">
          {saveError}
        </p>
      )}

      <VendorForm vendor={vendor} onSave={handleSave} />
    </div>
  );
}

export default SupplierEditPage;
