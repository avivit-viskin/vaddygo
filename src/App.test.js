import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// עוזר קטן: מרנדר את האפליקציה בנתיב מסוים (בטסטים אין דפדפן אמיתי)
function renderAt(path) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>
  );
}

// מסמנים משתמשת מחוברת (token) + הגדרה ראשונית שהושלמה, כדי שהטסטים
// יגיעו למסכים הפנימיים ולא יופנו למסך הפתיחה/כניסה
beforeEach(() => {
  localStorage.setItem("vaadygo.token", "test-token");
  localStorage.setItem(
    "vaadygo.onboarding",
    JSON.stringify({ ganName: "גן הבדיקות" })
  );
});

// מדמים את קריאות השרת כדי שהטסטים לא יהיו תלויים בשרת אמיתי
afterEach(() => {
  localStorage.clear();
  delete global.fetch;
});

test('שם המותג VaddyGo מוצג מודגש בכותרת', () => {
  renderAt('/');
  const heading = screen.getByRole('heading', { name: /VaddyGo/ });
  expect(heading).toBeInTheDocument();
  expect(heading.querySelector('strong.brand-name')).not.toBeNull();
});

test('הניווט התחתון מציג את חמשת המסכים', () => {
  renderAt('/');
  const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
  const links = within(nav).getAllByRole('link');
  expect(links).toHaveLength(5);
  expect(nav).toHaveTextContent('בית');
  expect(nav).toHaveTextContent('תלמידים');
  expect(nav).toHaveTextContent('לוח שנה');
  expect(nav).toHaveTextContent('מתנות');
  expect(nav).toHaveTextContent('קבצים');
});

test('מסך התלמידים מציג מצב טעינה בזמן שמחכים לשרת', () => {
  global.fetch = jest.fn(() => new Promise(() => {}));
  renderAt('/students');
  expect(screen.getByRole('status')).toBeInTheDocument();
});

test('מסך התלמידים מציג מצב ריק כשאין תלמידים', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
  );
  renderAt('/students');
  expect(await screen.findByText(/עדיין אין תלמידים/)).toBeInTheDocument();
});

test('מסך התלמידים מציג את התלמידים שהגיעו מהשרת', async () => {
  const students = [
    {
      id: 1,
      firstName: 'דנה',
      lastName: 'כהן',
      className: 'פרפרים',
      parentPhoneNumber: '050-1234567',
    },
  ];
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(students) })
  );
  renderAt('/students');
  expect(await screen.findByText(/דנה כהן/)).toBeInTheDocument();
});

test('מסך התלמידים מציג שגיאה ידידותית כשהשרת לא זמין', async () => {
  global.fetch = jest.fn(() => Promise.reject(new TypeError('network error')));
  renderAt('/students');
  expect(await screen.findByText(/לא הצלחנו להתחבר לשרת/)).toBeInTheDocument();
});

test('משתמשת לא מחוברת מופנית ממסך פנימי למסך הפתיחה', () => {
  localStorage.removeItem('vaadygo.token');
  renderAt('/students');
  // בלי token אין גישה למסך התלמידים — מגיעים למסך הפתיחה
  expect(screen.getByText(/ברוכים הבאים למשפחת/)).toBeInTheDocument();
});
