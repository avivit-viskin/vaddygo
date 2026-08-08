import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../hooks/useApi";
import {
  getPolls,
  createPoll,
  addVote,
  removeVote,
  deletePoll,
  setPollClosed,
  totalVotes,
  pollShareText,
  pollPublicUrl,
} from "../services/pollsService";
import { whatsappShareUrl } from "../services/whatsapp";
import Button from "../components/Button";
import Icon from "../components/Icon";
import Input from "../components/Input";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import CopyMessageButton from "../components/CopyMessageButton";
import "../styles/polls.css";

/*
  PollsPage (/polls) — פיצ'ר פרו: סקרים והצבעות.
  הוועד יוצר סקר ומקבל **קישור ציבורי** לשיתוף בוואטסאפ; ההורים עונים בתוך
  הקישור (מסך `/poll/:token`), והתוצאות כאן מתעדכנות אוטומטית מהשרת.

  סקר שנוצר כשהשרת לא היה זמין נשמר מקומית ומסומן "מקומי" — לו אין קישור,
  ולכן נשארים בו כפתורי הספירה הידנית (+/−) עד שהשרת חוזר.
*/
function PollsPage() {
  const { data: polls, isLoading, error, reload } = useApi(
    useCallback(() => getPolls(), [])
  );
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  function setOption(index, value) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  async function submit(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await createPoll(question, options);
      setQuestion("");
      setOptions(["", ""]);
      setFormError("");
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleClosed(poll) {
    await setPollClosed(poll.id, !poll.isClosed);
    reload();
  }

  return (
    <div className="polls-page">
      <div className="page-header">
        <h2>סקרים והצבעות</h2>
        <Link to="/">
          <Button variant="secondary">
            <Icon name="home" size={16} /> חזרה
          </Button>
        </Link>
      </div>

      <form className="poll-form" onSubmit={submit} noValidate>
        <Input
          id="poll-question"
          label="שאלת הסקר"
          placeholder="למשל: איזו מתנה לגננת בסוף השנה?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <span className="field__label">אפשרויות</span>
        {options.map((opt, i) => (
          <input
            key={i}
            className="field__input poll-form__option"
            placeholder={`אפשרות ${i + 1}`}
            value={opt}
            onChange={(e) => setOption(i, e.target.value)}
            aria-label={`אפשרות ${i + 1}`}
          />
        ))}
        <button
          type="button"
          className="poll-form__add"
          onClick={() => setOptions((prev) => [...prev, ""])}
        >
          <Icon name="plus" size={15} /> אפשרות נוספת
        </button>
        {formError && (
          <p className="field__error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" isLoading={isSaving}>
          יצירת סקר
        </Button>
      </form>

      {isLoading && <Spinner />}
      {!isLoading && error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && (polls || []).length === 0 && (
        <EmptyState icon="🗳️" message="עדיין אין סקרים — ניצור את הראשון למעלה." />
      )}

      {!isLoading && (polls || []).length > 0 && (
        <ul className="polls-list">
          {polls.map((poll) => {
            const total = poll.totalVotes ?? totalVotes(poll);
            const max = Math.max(...poll.options.map((o) => o.votes), 0);
            const publicUrl = pollPublicUrl(poll);
            return (
              <li key={`${poll.isLocal ? "local" : "srv"}-${poll.id}`} className="poll-card">
                <div className="poll-card__head">
                  <h3 className="poll-card__q">{poll.question}</h3>
                  <button
                    type="button"
                    className="poll-card__delete"
                    aria-label={`מחיקת הסקר ${poll.question}`}
                    onClick={() => setToDelete(poll)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>

                {poll.isClosed && (
                  <p className="poll-card__closed">
                    <Icon name="lock" size={14} /> הסקר סגור לתשובות נוספות
                  </p>
                )}

                <ul className="poll-options">
                  {poll.options.map((opt, i) => {
                    const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                    const leading = opt.votes > 0 && opt.votes === max;
                    return (
                      <li key={opt.id ?? i} className="poll-option">
                        <div className="poll-option__bar-wrap">
                          <div
                            className={`poll-option__bar${
                              leading ? " poll-option__bar--lead" : ""
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                          <span className="poll-option__text">
                            {/* הכתר דקורטיבי ובאלמנט נפרד — כדי שקוראי מסך
                                יקריאו את שם האפשרות נקי */}
                            {leading && <span aria-hidden="true">👑 </span>}
                            <span>{opt.text}</span>
                          </span>
                          <span className="poll-option__count">
                            {opt.votes} · {pct}%
                          </span>
                        </div>
                        {/* ספירה ידנית רק בסקר מקומי — בסקר שרת ההורים סופרים בעצמם */}
                        {poll.isLocal && (
                          <div className="poll-option__btns">
                            <button
                              type="button"
                              aria-label={`הוספת קול ל${opt.text}`}
                              onClick={() => {
                                addVote(poll.id, i);
                                reload();
                              }}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              aria-label={`הורדת קול מ${opt.text}`}
                              onClick={() => {
                                removeVote(poll.id, i);
                                reload();
                              }}
                            >
                              −
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="poll-card__foot">
                  <span className="poll-card__total">סה״כ {total} קולות</span>
                  <a
                    href={whatsappShareUrl(pollShareText(poll))}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="secondary">
                      <Icon name="message" size={15} /> שיתוף להורים
                    </Button>
                  </a>
                  {publicUrl && <CopyMessageButton text={publicUrl} label="העתקת הקישור" />}
                  {!poll.isLocal && (
                    <Button variant="secondary" onClick={() => toggleClosed(poll)}>
                      <Icon name={poll.isClosed ? "key" : "lock"} size={15} />{" "}
                      {poll.isClosed ? "פתיחה מחדש" : "סגירת הסקר"}
                    </Button>
                  )}
                </div>

                {poll.isLocal ? (
                  <p className="poll-card__hint">
                    נשמר במכשיר בלבד (השרת לא היה זמין) — לכן אין לו קישור
                    להורים, והספירה כאן ידנית.
                  </p>
                ) : (
                  <p className="poll-card__hint">
                    ההורים עונים דרך הקישור, והתוצאות כאן מתעדכנות לבד.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="מחיקת סקר"
        message={toDelete ? `למחוק את הסקר "${toDelete.question}"?` : ""}
        onConfirm={async () => {
          await deletePoll(toDelete.id, toDelete.isLocal);
          setToDelete(null);
          reload();
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

export default PollsPage;
