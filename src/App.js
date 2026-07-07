import { useState, useEffect } from "react";

function App() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("https://localhost:7017/api/students")
      .then((res) => res.json())
      .then((data) => setStudents(data))
      .catch(() => setError("אופס — לא הצלחנו להתחבר לשרת. בדקי שהוא רץ 🙂"));
  }, []);

  return (
    <div dir="rtl" style={{ fontFamily: "Arial", padding: "24px" }}>
      <h1>VaadyGo 💜</h1>
      <h2>רשימת התלמידים בגן</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {students.map((s) => (
          <li key={s.id} style={{ marginBottom: "8px" }}>
            <b>{s.firstName} {s.lastName}</b> — כיתה {s.className}, טלפון הורה: {s.parentPhoneNumber}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
