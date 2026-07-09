import Input from "../../components/Input";

/*
  CommitteesStep — צעד 3 באשף: ניהול כמה ועדים (UI_SPEC סעיף 3.5).
  לפי האפיון אפשר לנהל עד 4 ועדים באותו חשבון, עם שמות בכתיבה ידנית.
*/
function CommitteesStep({ data, onChange }) {
  function setCount(count) {
    const names = [...data.extraCommitteeNames];
    names.length = count;
    onChange({ extraCommittees: count, extraCommitteeNames: names });
  }

  return (
    <>
      <p className="wizard__question">האם זה הוועד היחיד בניהולך?</p>
      <div className="chips">
        <button
          type="button"
          className={`chip${data.extraCommittees === 0 ? " chip--active" : ""}`}
          aria-pressed={data.extraCommittees === 0}
          onClick={() => setCount(0)}
        >
          כן
        </button>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            className={`chip${data.extraCommittees === n ? " chip--active" : ""}`}
            aria-pressed={data.extraCommittees === n}
            onClick={() => setCount(n)}
          >
            {n}
          </button>
        ))}
      </div>

      {Array.from({ length: data.extraCommittees }).map((_, i) => (
        <Input
          key={i}
          id={`ob-committee-${i}`}
          label={`שם הגן של הוועד הנוסף ${i + 1}`}
          value={data.extraCommitteeNames[i] || ""}
          onChange={(e) => {
            const names = [...data.extraCommitteeNames];
            names[i] = e.target.value;
            onChange({ extraCommitteeNames: names });
          }}
        />
      ))}
    </>
  );
}

export default CommitteesStep;
