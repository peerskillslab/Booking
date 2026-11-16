// @ts-nocheck
import React from "react";
import { useIsDarkTheme } from "@/lib/useTheme";
import { CONTACT_EMAIL } from "@/lib/contact";

// Gemeinsame Farben der öffentlichen Infoseiten (Über uns, FAQ, Tutor:in werden)
const INFO_LIGHT = {
  "--bg": "oklch(98% 0.004 130)", "--ink": "oklch(20% 0.01 130)", "--ink-2": "oklch(50% 0.01 130)", "--ink-3": "oklch(58% 0.01 130)",
  "--surface": "#ffffff", "--line": "oklch(92% 0.006 130)", "--line-soft": "oklch(94% 0.006 130)",
  "--sage": "#eef3e6", "--accent": "#466E0E",
  // Zahlenkarten auf «Über uns» (abwechselnd grün und petrol)
  "--stat-green-bg": "#eef3e6", "--stat-green-ink": "#466e0e",
  "--stat-teal-bg": "#e8f2f2", "--stat-teal-ink": "#4e9597",
};

const INFO_DARK = {
  "--bg": "oklch(18% 0.006 130)", "--ink": "oklch(96% 0.004 130)", "--ink-2": "oklch(74% 0.006 130)", "--ink-3": "oklch(62% 0.006 130)",
  "--surface": "oklch(23% 0.006 130)", "--line": "oklch(30% 0.008 130)", "--line-soft": "oklch(36% 0.008 130)",
  "--sage": "#3a4a38", "--accent": "#8FBF4E",
  "--stat-green-bg": "#2c3a2a", "--stat-green-ink": "#9fcf5e",
  "--stat-teal-bg": "#253a3b", "--stat-teal-ink": "#7cc4c6",
};

// { style, accent, isDark }: style auf das äusserste Element der Seite setzen
export function useInfoTheme() {
  const isDark = useIsDarkTheme();
  return {
    isDark,
    style: isDark ? INFO_DARK : INFO_LIGHT,
    accent: isDark ? "#8FBF4E" : "#466E0E",
  };
}

// Kasten «Fragen? Schreib uns» am Ende von FAQ und Tutor:in werden
export function ContactBox({ title, children, accent, id, style }) {
  return (
    <div id={id} style={{ padding: "28px 32px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18, ...style }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 14px", lineHeight: 1.5 }}>
        {children}
      </p>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 14, fontWeight: 600, color: accent,
          textDecoration: "none",
        }}
      >
        {CONTACT_EMAIL}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  );
}
