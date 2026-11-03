// @ts-nocheck
import React, { useState } from "react";
import { useIsDarkTheme } from "@/lib/useTheme";
import { useSiteContent } from "@/lib/siteContent";
import { linkify } from "@/lib/linkify";
import { FAQ_DEFAULTS } from "@/content/defaults";

const CSS_LIGHT = {
  "--bg": "oklch(98% 0.004 130)", "--ink": "oklch(20% 0.01 130)", "--ink-2": "oklch(50% 0.01 130)", "--ink-3": "oklch(58% 0.01 130)",
  "--surface": "#ffffff", "--line": "oklch(92% 0.006 130)", "--line-soft": "oklch(94% 0.006 130)",
  "--sage": "#eef3e6", "--accent": "#466E0E",
};

const CSS_DARK = {
  "--bg": "oklch(18% 0.006 130)", "--ink": "oklch(96% 0.004 130)", "--ink-2": "oklch(74% 0.006 130)", "--ink-3": "oklch(62% 0.006 130)",
  "--surface": "oklch(23% 0.006 130)", "--line": "oklch(30% 0.008 130)", "--line-soft": "oklch(36% 0.008 130)",
  "--sage": "#3a4a38", "--accent": "#8FBF4E",
};

function AccordionItem({ q, a, isDark }) {
  const [open, setOpen] = useState(false);
  const accentColor = isDark ? "#8FBF4E" : "#466E0E";

  return (
    <div style={{ borderBottom: "1px solid var(--line)" }}>
      {/* Als button, nicht als klickbares div — sonst ist die FAQ per
          Tastatur nicht bedienbar. */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 0",
          gap: 16,
          background: "none",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)", lineHeight: 1.35 }}>
          {q}
        </span>
        <span
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: open ? accentColor : "var(--surface)",
            border: `1px solid ${open ? accentColor : "var(--line)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s, border 0.15s",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d={open ? "M2 5h6" : "M5 2v6M2 5h6"}
              stroke={open ? "#fff" : accentColor}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: 18, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6, paddingRight: 40 }}>
          {linkify(a)}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const isDark = useIsDarkTheme();
  const CSS = isDark ? CSS_DARK : CSS_LIGHT;
  const content = useSiteContent("faq", FAQ_DEFAULTS);

  return (
    <div style={CSS}>
      <style>{`
        .faq-container { max-width: 760px; margin: 0 auto; padding: 64px 56px 96px; }
        @media (max-width: 640px) {
          .faq-container { padding: 36px 16px 64px; }
        }
      `}</style>

      <div className="faq-container">
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-3)", fontSize: 14, marginBottom: 32 }}>
          <span style={{ width: 28, height: 1, background: "var(--ink-3)", display: "block" }} />
          <span style={{ textTransform: "uppercase", fontWeight: 500 }}>FAQ</span>
        </div>

        <h1 style={{ fontWeight: 600, fontSize: "clamp(32px, 7vw, 72px)", lineHeight: 0.95, margin: "0 0 16px", wordBreak: "break-word" }}>
          Häufige<br />
          <span style={{ color: isDark ? "#8FBF4E" : "#466E0E" }}>Fragen.</span>
        </h1>

        <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 56px", maxWidth: 520 }}>
          {linkify(content.intro)}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {content.sections.map((section, si) => (
            <div key={`${section.category}-${si}`}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500, marginBottom: 4 }}>
                {section.category}
              </div>
              <div>
                {section.items.map((item, ii) => (
                  <AccordionItem key={`${item.q}-${ii}`} q={item.q} a={item.a} isDark={isDark} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 64, padding: "28px 32px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Noch eine Frage?</div>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Falls du keine Antwort gefunden hast, schreib uns einfach eine Mail.
          </p>
          <a
            href="mailto:info@peerskillslab.ch"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 600, color: isDark ? "#8FBF4E" : "#466E0E",
              textDecoration: "none",
            }}
          >
            info@peerskillslab.ch
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
