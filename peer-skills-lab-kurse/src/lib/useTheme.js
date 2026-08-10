import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "psl-theme";

// Zwei parallele Mechanismen: [data-theme] steuert die --psl-*-Tokens,
// .dark die HSL-Tokens für Tailwind. Beide müssen synchron bleiben.
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function readStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "light";
  } catch {
    return "light";
  }
}

/**
 * Owns the theme: reads it once, applies it to <html>, and toggles it.
 * Used by the two layouts. Components that only need to *know* the current
 * theme should use useIsDarkTheme() instead.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode — theme just won't persist.
      }
      return next;
    });
  }, []);

  return [theme, toggle];
}

function subscribeToThemeAttribute(onChange) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getIsDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/**
 * Read-only view of the active theme, for components that build inline styles
 * (AboutUs, FAQ, badges) instead of using CSS variables.
 */
export function useIsDarkTheme() {
  return useSyncExternalStore(subscribeToThemeAttribute, getIsDark, () => false);
}
