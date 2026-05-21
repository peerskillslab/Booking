import { useEffect, useRef } from "react";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 Minuten
const EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];

export function useInactivityLogout(logout) {
  const timerRef = useRef(null);

  useEffect(() => {
    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, TIMEOUT_MS);
    };

    reset();
    EVENTS.forEach((e) => window.addEventListener(e, reset));

    return () => {
      clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [logout]);
}
