import { render, screen } from '@testing-library/react';
import App from './App';

// מדמים את קריאת השרת כדי שהטסט לא יהיה תלוי בשרת אמיתי
beforeEach(() => {
  global.fetch = jest.fn(() => new Promise(() => {}));
});

afterEach(() => {
  delete global.fetch;
});

test('renders VaadyGo heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /VaadyGo/i });
  expect(heading).toBeInTheDocument();
});

test('renders students list title', () => {
  render(<App />);
  expect(screen.getByText(/רשימת התלמידים בגן/)).toBeInTheDocument();
});
