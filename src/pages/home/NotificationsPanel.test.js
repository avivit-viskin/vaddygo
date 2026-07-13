import { render, fireEvent, act } from "@testing-library/react";
import NotificationsPanel from "./NotificationsPanel";

/*
  NotificationsPanel — סגירה אוטומטית אחרי 2 שניות בלי פעילות.
  משתמשים בטיימרים מדומים כדי לא לחכות בפועל.
*/
const noop = () => {};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderPanel(onClose) {
  return render(
    <NotificationsPanel
      isOpen
      notifications={[]}
      onClose={onClose}
      onMarkRead={noop}
      onMarkAllRead={noop}
    />
  );
}

test("נסגר לבד אחרי 2 שניות בלי פעילות", () => {
  const onClose = jest.fn();
  renderPanel(onClose);

  act(() => {
    jest.advanceTimersByTime(2000);
  });

  expect(onClose).toHaveBeenCalledTimes(1);
});

test("פעילות מאפסת את השעון — לא נסגר כל עוד נוגעים", () => {
  const onClose = jest.fn();
  renderPanel(onClose);

  act(() => {
    jest.advanceTimersByTime(1500);
  });
  act(() => {
    fireEvent.keyDown(window, { key: "a" }); // פעילות → איפוס השעון
  });
  act(() => {
    jest.advanceTimersByTime(1500); // עברו 3ש סה"כ, אך רק 1.5ש מאז האיפוס
  });

  expect(onClose).not.toHaveBeenCalled();
});

test("כשהפאנל סגור — אין סגירה אוטומטית", () => {
  const onClose = jest.fn();
  render(
    <NotificationsPanel
      isOpen={false}
      notifications={[]}
      onClose={onClose}
      onMarkRead={noop}
      onMarkAllRead={noop}
    />
  );

  act(() => {
    jest.advanceTimersByTime(30000);
  });

  expect(onClose).not.toHaveBeenCalled();
});
