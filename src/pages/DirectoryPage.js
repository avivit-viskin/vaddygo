import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getSupplierDirectory } from "../services/vendorsService";
import Logo from "../components/Logo";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import "../styles/supplier-public.css";

/*
  DirectoryPage — מדריך הספקים הציבורי (/directory): מרקטפלייס לגלישה בכל
  הספקים, עם חיפוש וסינון לפי קטגוריה. כל ספק מוביל לקטלוג הציבורי שלו.
*/
function DirectoryPage() {
  const fetcher = useCallback(() => getSupplierDirectory(), []);
  const { data, isLoading, error, reload } = useApi(fetcher);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const vendors = useMemo(() => data || [], [data]);
  const categories = useMemo(
    () => [...new Set(vendors.map((v) => v.category).filter(Boolean))],
    [vendors]
  );
  const filtered = vendors.filter((v) => {
    const matchesCat = !category || v.category === category;
    const term = query.trim();
    const matchesQuery =
      !term ||
      (v.name || "").includes(term) ||
      (v.city || "").includes(term) ||
      (v.category || "").includes(term);
    return matchesCat && matchesQuery;
  });

  if (isLoading) {
    return <Spinner text="טוען ספקים..." />;
  }
  if (error) {
    return (
      <div className="pub" dir="rtl">
        <ErrorMessage
          message="לא הצלחנו לטעון את מדריך הספקים."
          onRetry={reload}
        />
      </div>
    );
  }

  return (
    <div className="pub" dir="rtl">
      <div className="pub-hero__logo" style={{ marginBottom: 6 }}>
        <Logo />
      </div>
      <h1 className="pub-title">מדריך הספקים</h1>
      <p className="pub-sub">מצאו ספקים לוועד — לפי קטגוריה, עיר או חיפוש.</p>

      <input
        className="pub-search"
        placeholder="חיפוש ספק / עיר / קטגוריה..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="חיפוש ספקים"
      />

      {categories.length > 0 && (
        <div className="pub-chips">
          <button
            type="button"
            className={`pub-chip${!category ? " pub-chip--active" : ""}`}
            onClick={() => setCategory("")}
          >
            הכל
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`pub-chip${category === c ? " pub-chip--active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="🔎" message="לא נמצאו ספקים מתאימים." />
      ) : (
        <ul className="pub-vendors">
          {filtered.map((v) => (
            <li key={v.id}>
              <Link className="pub-vendor" to={`/catalog/${v.id}`}>
                <div className="pub-vendor__name">{v.name}</div>
                <div className="pub-vendor__meta">
                  {v.category}
                  {v.category && v.city ? " · " : ""}
                  {v.city}
                </div>
                {v.productCount > 0 && (
                  <span className="pub-vendor__count">
                    {v.productCount} מוצרים »
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="pub-foot">
        <Link to="/suppliers">VaddyGo</Link> — ניהול ועדי הורים
      </p>
    </div>
  );
}

export default DirectoryPage;
