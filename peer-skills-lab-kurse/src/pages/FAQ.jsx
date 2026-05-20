// @ts-nocheck
import React, { useState } from "react";

const CSS = {
  "--bg": "#FAFAF8", "--ink": "#1F2C0A", "--ink-2": "#4A5A30", "--ink-3": "#7A8A60",
  "--surface": "#F5F2E8", "--line": "#E8E2D0", "--line-soft": "#EEEAD8",
  "--sage": "#E3EAD0", "--accent": "#466E0E",
};
const A = { main: "#466E0E", soft: "#E3EAD0", ink: "#1F2C0A", deep: "#2F4A09" };

const FAQS = [
  {
    category: "Allgemeines",
    items: [
      {
        q: "Was ist das Peer Skills Lab?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
      {
        q: "Für wen sind die Kurse gedacht?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
      {
        q: "Ist das Peer Skills Lab ein offizieller Teil des Studiums?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
    ],
  },
  {
    category: "Kurse & Buchungen",
    items: [
      {
        q: "Wie buche ich einen Kurs?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
      {
        q: "Bis wann kann ich eine Buchung stornieren?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
      {
        q: "Was passiert, wenn ein Kurs ausgebucht ist?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
      {
        q: "Wie viel kosten die Kurse?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
    ],
  },
  {
    category: "Tutor:innen & Mitmachen",
    items: [
      {
        q: "Wie kann ich selbst Tutor:in werden?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
      {
        q: "Welche Voraussetzungen brauche ich, um zu unterrichten?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
      {
        q: "Wie kann ich dem Verein beitreten?",
        a: "Platzhalter – hier kommt die Antwort.",
      },
    ],
  },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid var(--line)",
        cursor: "pointer",
      }}
      onClick={() => setOpen((o) => !o)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 0",
          gap: 16,
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
            background: open ? A.main : "var(--surface)",
            border: `1px solid ${open ? A.main : "var(--line)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s, border 0.15s",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d={open ? "M2 5h6" : "M5 2v6M2 5h6"}
              stroke={open ? "#fff" : A.main}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
      {open && (
        <div style={{ paddingBottom: 18, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6, paddingRight: 40 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
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
          <span style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}>FAQ</span>
        </div>

        <h1 style={{ fontWeight: 600, fontSize: "clamp(32px, 7vw, 72px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: "0 0 16px", wordBreak: "break-word" }}>
          Häufige<br />
          <span style={{ color: A.main }}>Fragen.</span>
        </h1>

        <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 56px", maxWidth: 520 }}>
          Hier findest du Antworten auf die häufigsten Fragen rund um das Peer Skills Lab, unsere Kurse und wie du mitmachen kannst.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {FAQS.map((section) => (
            <div key={section.category}>
              <div style={{ fontSize: 13, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500, marginBottom: 4 }}>
                {section.category}
              </div>
              <div>
                {section.items.map((item) => (
                  <AccordionItem key={item.q} q={item.q} a={item.a} />
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
              fontSize: 14, fontWeight: 600, color: A.main,
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
