import { useLayoutEffect, useRef, useState } from 'react';

const lastAnimated = new Map();

/**
 * Returns true only on the first render for a value and whenever that value
 * changes; returns false for later renders of the same value (e.g. page
 * navigation that remounts the layout). Module scope resets on reload, so a
 * fresh page load always animates.
 *
 * @param {string} key - Stable identity for the counter slot.
 * @param {number} value - The current value of the counter.
 */
export function useShouldAnimate(key, value) {
  const [animate, setAnimate] = useState(() => {
    const last = lastAnimated.get(key);
    return last === undefined || last !== value;
  });

  // Re-animate when the value changes while this instance stays mounted
  // (e.g. a realtime coin balance update). Adjusting state during render
  // triggers a synchronous re-render before commit.
  const prevValue = useRef(value);
  if (prevValue.current !== value) {
    prevValue.current = value;
    setAnimate(true);
  }

  // Record the latest value after commit so a future remount with the same
  // value renders statically. Runs after render, so StrictMode's double
  // render never sees a false "already animated" on first mount.
  useLayoutEffect(() => {
    lastAnimated.set(key, value);
  }, [key, value]);

  return animate;
}
