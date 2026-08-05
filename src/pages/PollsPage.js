import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getPolls,
  createPoll,
  addVote,
  removeVote,
  deletePoll,
  totalVotes,
  pollShareText,
} from "../services/pollsService";
import { whatsappShareUrl } from "../services/whatsapp";
import Button from "../components/Button";
import Icon from "../components/Icon";
import Input from "../components/Input";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import "../styles/polls.css";

/*
  PollsPage (/polls) — פיצ'ר פרו: סקרים והצבעות.
  הוועד יוצר סקר, משתף אותו להורים בוואטסאפ, וסופר את התשובות בלחיצה (+/−)
  עם תצוגת תוצאות חיה וסימון המוביל. הכול נשמר מקומית. (הצבעה ישירה של הורים
  דרך קישור ציבורי = שדרוג עתידי עם שרת.)
*/
function PollsPage() {
  const [polls, setPolls] = useState(() => getPolls());
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [formError, setFormError] = useState("");
  const [toDelete, setToDelete] = useState(null);

  const refresh = () => setPolls(getPolls());

  function setOption(index, value) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function submit(event) {
    event.preventDefault();
    try {
      createPoll(question, options);
      setQuestion("");
      setOptions(["", ""]);
      setFormError("");
      refresh();
    } catch (err) {
      setFormError(err.message);
    }
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
        <Button type="submit">יצירת סקר</Button>
      </form>

      {polls.length === 0 ? (
        <EmptyState icon="🗳️" message="עדיין אין סקרים — ניצור את הראשון למעלה." />
      ) : (
        <ul className="polls-list">
          {polls.map((poll) => {
            const total = totalVotes(poll);
            const max = Math.max(...poll.options.map((o) => o.votes), 0);
            return (
              <li key={poll.id} className="poll-card">
                <div className="poll-card__head">
                  <h3 className="poll-card__q">{poll.question}</h3>
                  <button
                    type="button"
                    className="poll-card__delete"
                    aria-label="מחיקת הסקר"
                    onClick={() => setToDelete(poll)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>

                <ul className="poll-options">
                  {poll.options.map((opt, i) => {
                    const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                    const leading = opt.votes > 0 && opt.votes === max;
                    return (
                      <li key={i} className="poll-option">
                        <div className="poll-option__bar-wrap">
                          <div
                            className={`poll-option__bar${
                              leading ? " poll-option__bar--lead" : ""
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                          <span className="poll-option__text">
                            {leading && "👑 "}
                            {opt.text}
                          </span>
                          <span className="poll-option__count">
                            {opt.votes} · {pct}%
                          </span>
                        </div>
                        <div className="poll-option__btns">
                          <button
                            type="button"
                            aria-label={`הוספת קול ל${opt.text}`}
                            onClick={() => {
                              addVote(poll.id, i);
                              refresh();
                            }}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            aria-label={`הורדת קול מ${opt.text}`}
                            onClick={() => {
                              removeVote(poll.id, i);
                              refresh();
                            }}
                          >
                            −
                          </button>
                        </div>
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
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="מחיקת סקר"
        message={toDelete ? `למחוק את הסקר "${toDelete.question}"?` : ""}
        onConfirm={() => {
          deletePoll(toDelete.id);
          setToDelete(null);
          refresh();
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

export default PollsPage;
