// @ts-nocheck
import React from "react";
import { useIsDarkTheme } from "@/lib/useTheme";

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

const REQUIREMENTS = [
  {
    title: "Bestandenes 3. Studienjahr",
    body: "Du kannst dich bewerben, sobald du das 3. Studienjahr Humanmedizin erfolgreich abgeschlossen hast.",
    fixed: true,
  },
  {
    title: "Teilnahme am Didaktikkurs",
    body: "Der eintägige Didaktikkurs findet jedes Jahr im März statt und ist für alle neu rekrutierten Tutor:innen obligatorisch.",
    fixed: true,
  },
  {
    title: "Keine Erfahrung nötig",
    body: "Du brauchst keine Erfahrung im Tutorieren, irgendwo müssen alle anfangen.",
    fixed: true,
  },
];

const TIMELINE = [
  {
    month: "Ende September",
    title: "Umfrage bei aktiven Tutor:innen",
    body: "Wir fragen die aktiven Tutor:innen, wer im nächsten Semester weiterhin tutorieren wird – daraus ergibt sich der Bedarf an neuen Tutor:innen.",
  },
  {
    month: "Oktober",
    title: "Vorstand entscheidet Anzahl",
    body: "Der Vorstand legt fest, wie viele neue Tutor:innen in diesem Jahr rekrutiert werden.",
  },
  {
    month: "November",
    title: "Bewerbungsfenster",
    body: "Bewerbung mit Fragebogen und Motivationsschreiben. Link zum Fragebogen: [Platzhalter: Link folgt]",
  },
  {
    month: "Januar – Februar",
    title: "Auswahl & Kontaktierung",
    body: "Wir schauen uns eure Bewerbungen an, und die ausgewählten Studierenden werden kontaktiert.",
  },
  {
    month: "März",
    title: "Didaktikkurs",
    body: "Eintägiger, obligatorischer Didaktikkurs für alle neuen Tutor:innen.",
  },
];

function Timeline({ accentColor }) {
  return (
    <div className="tw-timeline">
      {TIMELINE.map((t, i) => (
        <div className="tw-t-item" key={t.month}>
          <div className="tw-t-rail">
            <span className="tw-t-dot" style={{ background: accentColor }} />
            {i < TIMELINE.length - 1 && <span className="tw-t-connector" />}
          </div>
          <div className="tw-t-content">
            <div className="tw-t-month" style={{ color: accentColor }}>{t.month}</div>
            <div className="tw-t-title">{t.title}</div>
            <p className="tw-t-body">{t.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TutorWerden() {
  const isDark = useIsDarkTheme();
  const CSS = isDark ? CSS_DARK : CSS_LIGHT;
  const accentColor = isDark ? "#8FBF4E" : "#466E0E";

  return (
    <div style={CSS}>
      <style>{`
        .tw-container { max-width: min(1280px, 88vw); margin: 0 auto; padding: 64px 0 96px; }
        .tw-req-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

        /* Timeline — mobile-first: vertical rail with dot + connector on the left */
        .tw-timeline { display: flex; flex-direction: column; }
        .tw-t-item { display: flex; gap: 16px; }
        .tw-t-rail { display: flex; flex-direction: column; align-items: center; width: 14px; flex-shrink: 0; }
        .tw-t-dot { width: 13px; height: 13px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 3px var(--bg); }
        .tw-t-connector { flex: 1; width: 2px; min-height: 28px; background: var(--line); margin-top: 4px; }
        .tw-t-content { padding-bottom: 28px; }
        .tw-t-month { font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 4px; }
        .tw-t-title { font-size: 15.5px; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
        .tw-t-body { font-size: 13.5px; color: var(--ink-2); line-height: 1.55; margin: 0; max-width: 460px; }

        @media (min-width: 860px) {
          /* Timeline — desktop: horizontal rail, dots connected left-to-right */
          .tw-timeline { flex-direction: row; align-items: flex-start; }
          .tw-t-item { flex-direction: column; flex: 1; gap: 0; }
          .tw-t-rail { flex-direction: row; width: 100%; align-items: center; }
          .tw-t-connector { height: 2px; width: auto; min-height: 0; margin-top: 0; margin-left: 4px; }
          .tw-t-item:last-child .tw-t-rail { width: 13px; }
          .tw-t-content { padding: 14px 10px 0 0; text-align: left; }
        }

        @media (max-width: 720px) {
          .tw-container { max-width: none; padding: 36px 16px 64px; }
          .tw-req-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="tw-container">
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-3)", fontSize: 14, marginBottom: 32 }}>
          <span style={{ width: 28, height: 1, background: "var(--ink-3)", display: "block" }} />
          <span style={{ textTransform: "uppercase", fontWeight: 500 }}>Mitmachen</span>
        </div>

        <h1 style={{ fontWeight: 600, fontSize: "clamp(32px, 7vw, 64px)", lineHeight: 1.0, margin: "0 0 16px", wordBreak: "break-word", color: "var(--ink)" }}>
          Werde<br />
          <span style={{ color: accentColor }}>Tutor:in.</span>
        </h1>

        <p style={{ fontSize: 17, color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 56px", maxWidth: 720 }}>
          Das Herz des Peer Skills Lab sind unsere Tutor:innen. Einmal im Jahr
          rekrutieren wir deshalb neue Peer-Tutor:innen.
        </p>

        {/* Voraussetzungen */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500, marginBottom: 16 }}>
            Voraussetzungen
          </div>
          <div className="tw-req-grid">
            {REQUIREMENTS.map((r) => (
              <div
                key={r.title}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  padding: "22px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: r.fixed ? accentColor : "var(--ink-3)",
                    }}
                  />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{r.title}</span>
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-2)", margin: 0 }}>{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ablauf */}
        <section style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500, marginBottom: 24 }}>
            So funktioniert die Bewerbung
          </div>
          <Timeline accentColor={accentColor} />
        </section>

        {/* Hinweis zur Anzahl Plätze */}
        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              padding: "20px 24px",
              background: "var(--sage)",
              border: `1px solid ${accentColor}30`,
              borderRadius: 16,
              fontSize: 14,
              color: "var(--ink-2)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: "var(--ink)" }}>Wie viele Tutor:innen werden gesucht?</strong><br />
            Die Anzahl der neu rekrutierten Tutor:innen wird vom Vorstand jedes Jahr
            individuell festgelegt, abhängig vom aktuellen Bedarf an Kursen und
            Kapazitäten. Es gibt also keine fixe Anzahl offener Plätze pro Jahrgang.
          </div>
        </section>

        {/* Kontakt */}
        <div style={{ padding: "28px 32px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Fragen zur Bewerbung?</div>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 14px", lineHeight: 1.5 }}>
            Melde dich einfach bei uns, falls du Fragen zur Rekrutierung oder zum
            Bewerbungsverfahren hast.
          </p>
          <a
            href="mailto:info@peerskillslab.ch"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 14, fontWeight: 600, color: accentColor,
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
