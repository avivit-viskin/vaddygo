import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import useApi from "../hooks/useApi";
import Logo from "../components/Logo";
import Button from "../components/Button";
import Icon from "../components/Icon";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";
import BrandName from "../components/BrandName";
import { getPublicPoll, votePublicPoll } from "../services/pollsService";
import "../styles/polls.css";

/*
  PublicPollPage (/poll/:token) — המסך שההורים פותחים מהקישור שהוועד שלח.
  בלי חשבון ובלי התחברות: בוחרים אפשרות, לוחצים "שליחת התשובה", ורואים את
  התוצאות. ההצבעה נספרת אצל הוועד אוטומטית.

  אין כאן שום מידע על הגן, על הילדים או על שאר ההורים — רק השאלה והתוצאות.
*/
function PublicPollPage() {
  const { token } = useParams();
  const {
    data: poll,
    isLoading,
    error,
    reload,
  } = useApi(useCallback(() => getPublicPoll(token), [token]));

  const [selected, setSelected] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [voted, setVoted] = useState(false);

  async function send() {
    if (selected === null) {
      setVoteError("צריך לבחור אפשרות");
      return;
    }
    setIsSending(true);
    setVoteError("");
    try {
      await votePublicPoll(token, selected);
      setVoted(true);
      reload();
    } catch (err) {
      // "כבר הצבעתם" הוא מצב תקין — מציגים את התוצאות ולא כשגיאה מבהילה
      setVoteError(err.message);
      setVoted(true);
      reload();
    } finally {
      setIsSending(false);
    }
  }

  const total = poll?.totalVotes || 0;
  const showResults = voted || poll?.isClosed;

  return (
    <div className="public-poll" dir="rtl">
      <header className="public-poll__header">
        <Logo size={40} />
        <p className="public-poll__brand">
          סקר של הוועד · <BrandName />
        </p>
      </header>

      {isLoading && <Spinner />}
      {!isLoading && error && <ErrorMessage message={error} />}

      {!isLoading && !error && poll && (
        <main className="poll-card public-poll__card">
          <h1 className="poll-card__q">{poll.question}</h1>

          {poll.isClosed && (
            <p className="poll-card__closed">
              <Icon name="lock" size={14} /> הסקר נסגר לתשובות. תודה!
            </p>
          )}

          <ul className="poll-options">
            {poll.options.map((opt) => {
              const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
              return (
                <li key={opt.id} className="poll-option">
                  {showResults ? (
                    <div className="poll-option__bar-wrap">
                      <div
                        className="poll-option__bar"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="poll-option__text">{opt.text}</span>
                      <span className="poll-option__count">
                        {opt.votes} · {pct}%
                      </span>
                    </div>
                  ) : (
                    <label className="public-poll__choice">
                      <input
                        type="radio"
                        name="poll-option"
                        value={opt.id}
                        checked={selected === opt.id}
                        onChange={() => {
                          setSelected(opt.id);
                          setVoteError("");
                        }}
                      />
                      <span>{opt.text}</span>
                    </label>
                  )}
                </li>
              );
            })}
          </ul>

          {voteError && (
            <p className="field__error" role="alert">
              {voteError}
            </p>
          )}

          {showResults ? (
            <p className="public-poll__thanks">
              {voteError ? "" : "תודה! התשובה נקלטה 💜 "}סה״כ {total} תשובות.
            </p>
          ) : (
            <Button onClick={send} isLoading={isSending}>
              שליחת התשובה
            </Button>
          )}
        </main>
      )}
    </div>
  );
}

export default PublicPollPage;
