import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import { getStudents } from "../services/studentsService";
import { whatsappUrlWithText } from "../services/whatsapp";
import CopyMessageButton from "../components/CopyMessageButton";
import Button from "../components/Button";
import Icon from "../components/Icon";
import Input from "../components/Input";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import "../styles/contacts.css";

/*
  ContactsPage (/contacts) — פיצ'ר פרו: ספר קשרים + שליחה מרוכזת.
  מרכז את פרטי כל ההורים (מרשימת התלמידים) עם חיפוש, חיוג ווואטסאפ לכל אחד,
  ושליחה מרוכזת: כותבים הודעה, מעתיקים את כל המספרים ואת ההודעה, ופותחים
  "רשימת תפוצה" בוואטסאפ — כך כל ההורים מקבלים את ההודעה בפרטי, בבת אחת.
*/
function digits(phone) {
  return (phone || "").replace(/\D/g, "");
}

function ContactsPage() {
  const { data: students, isLoading } = useApi(getStudents);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const contacts = useMemo(
    () => (students || []).filter((s) => s.parentPhoneNumber),
    [students]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.className} ${c.parentPhoneNumber}`
        .toLowerCase()
        .includes(term)
    );
  }, [contacts, search]);

  const allPhones = filtered.map((c) => c.parentPhoneNumber).join("\n");

  if (isLoading) {
    return <Spinner text="טוען את ספר הקשרים..." />;
  }

  return (
    <div className="contacts-page">
      <div className="page-header">
        <h2>ספר קשרים ({contacts.length})</h2>
        <Link to="/">
          <Button variant="secondary">
            <Icon name="home" size={16} /> חזרה
          </Button>
        </Link>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon="📇"
          message="אין עדיין אנשי קשר — נוספים אוטומטית מרשימת התלמידים."
        />
      ) : (
        <>
          {/* שליחה מרוכזת */}
          <div className="contacts-broadcast">
            <h3 className="contacts-broadcast__title">שליחה מרוכזת להורים</h3>
            <label className="field__label" htmlFor="broadcast-message">
              ההודעה שתישלח
            </label>
            <textarea
              id="broadcast-message"
              className="contacts-textarea"
              rows={3}
              placeholder="למשל: תזכורת — מחר יום כיף! נא להביא כובע ובקבוק מים 😊"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="contacts-broadcast__hint">
              💡 להעברה לכולם בבת אחת: מעתיקים את המספרים ואת ההודעה, ובוואטסאפ
              יוצרים <strong>"רשימת תפוצה חדשה"</strong> — כל הורה מקבל בפרטי.
            </p>
            <div className="contacts-broadcast__actions">
              <CopyMessageButton
                text={allPhones}
                label={`העתקת ${filtered.length} מספרים`}
              />
              <CopyMessageButton text={message} label="העתקת ההודעה" />
            </div>
          </div>

          <Input
            id="contacts-search"
            label="חיפוש"
            type="search"
            placeholder="שם, כיתה או טלפון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <EmptyState icon="🔍" message="לא נמצאו אנשי קשר שמתאימים לחיפוש" />
          ) : (
            <ul className="contacts-list">
              {filtered.map((c) => (
                <li key={c.id} className="contact-row">
                  <div className="contact-row__info">
                    <span className="contact-row__name">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="contact-row__meta">
                      {c.className ? `${c.className} · ` : ""}
                      {c.parentPhoneNumber}
                    </span>
                  </div>
                  <div className="contact-row__actions">
                    <a
                      className="contact-row__btn"
                      href={`tel:${digits(c.parentPhoneNumber)}`}
                      aria-label={`חיוג ל${c.firstName}`}
                    >
                      <Icon name="phone" size={18} />
                    </a>
                    <a
                      className="contact-row__btn contact-row__btn--wa"
                      href={whatsappUrlWithText(c.parentPhoneNumber, message)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`וואטסאפ ל${c.firstName}`}
                    >
                      <Icon name="message" size={18} />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default ContactsPage;
