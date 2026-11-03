// @ts-nocheck
import React, { useMemo } from "react";
import { useIsDarkTheme } from "@/lib/useTheme";
import { Link } from "react-router-dom";
import { useInfoTheme } from "@/components/info/infoTheme";
import { useSiteContent } from "@/lib/siteContent";
import { ABOUT_DEFAULTS } from "@/content/defaults";

// --- Custom SVG icons from design ---
const Icon = {
  Heart: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 20s-7-4.5-7-10.5C5 6 7.5 4 10 4c1.5 0 3 .8 4 2 1-1.2 2.5-2 4-2 2.5 0 4.5 2 4.5 5.5C22.5 15.5 12 20 12 20z"/>
    </svg>
  ),
  Stethoscope: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 3v6a4 4 0 0 0 8 0V3" /><path d="M5 3h1.5M11.5 3H13" />
      <path d="M9 13v2.5a4.5 4.5 0 0 0 9 0V14" /><circle cx="18" cy="12.5" r="1.6" />
    </svg>
  ),
  Repeat: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 9a5 5 0 0 1 5-5h9" /><path d="M15 1l3 3-3 3" />
      <path d="M20 15a5 5 0 0 1-5 5H6" /><path d="M9 23l-3-3 3-3" />
    </svg>
  ),
  Users: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="9" cy="8.5" r="3.2" /><path d="M2.5 20c.7-3.4 3.3-5 6.5-5s5.8 1.6 6.5 5" />
      <circle cx="17" cy="9" r="2.6" /><path d="M16 14.4c2.6.2 4.5 1.7 5.2 4.6" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17" />
      <path d="M8 3.5v3M16 3.5v3" /><path d="M8 13.5l1.6 1.6L13 11.7" />
    </svg>
  ),
};

const A_LIGHT = { main: "#466E0E", soft: "#E3EAD0", ink: "#1F2C0A", deep: "#2F4A09" };
const A_DARK = { main: "#8FBF4E", soft: "#3a4a38", ink: "#f0f0f0", deep: "#d0d0d0" };

// Zeilenumbrüche aus den bearbeitbaren Texten (Enter im Feld) als <br />
function lines(text) {
  return String(text || "").split("\n").map((l, i, a) => (
    <React.Fragment key={i}>{l}{i < a.length - 1 && <br />}</React.Fragment>
  ));
}

const PILL_ICONS = [Icon.Stethoscope, Icon.Repeat, Icon.Users, Icon.Heart];

const TONE_PAIRS = [
  ["#E5DFC9","#D5CCAB"], ["#DDE2CB","#C8D1AA"], ["#E8DEC8","#D6BF9A"],
  ["#D7DDC8","#BFC9A4"], ["#EBE2CF","#DAC8A8"], ["#D5DCCA","#BAC4A1"],
];

function PhotoSquare({ tone = 0, style: sx }) {
  const [a, b] = TONE_PAIRS[tone % TONE_PAIRS.length];
  return <div style={{ width: "100%", height: "100%", borderRadius: 16, background: `repeating-linear-gradient(135deg, ${a} 0 12px, ${b} 12px 24px)`, border: "1px solid var(--line)", ...sx }} />;
}

function Pill({ icon: I, label, A }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 14.5, fontWeight: 500, color: A.main }}>
      <I width="18" height="18" stroke="currentColor" /><span>{label}</span>
    </div>
  );
}

function HowCards({ c }) {
  const steps = c.steps.map((st, i) => ({ ...st, n: String(i + 1).padStart(2, "0") }));
  return (
    <section id="how" className="au-section">
      <div className="au-how-header" style={{ display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 32 }}>
        <h2 className="au-h2" style={{ fontWeight: 600, lineHeight: 1.0, margin: 0, maxWidth: 720 }}>
          {lines(c.howTitle)}
        </h2>
        <div style={{ fontSize: 13.5, textTransform: "uppercase", fontWeight: 500, color: "var(--ink-3)" }}>{c.howKicker}</div>
      </div>
      <div className="au-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {steps.map(s => {
          return (
            <div key={s.n} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column", gap: 18, minHeight: 280 }}>
              <span style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 500 }}>{s.n}</span>
              <h3 style={{ fontSize: 21, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{s.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: 0, color: "var(--ink-2)" }}>{s.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatsBlock({ c }) {
  const stats = c.stats;
  return (
    <section id="stats" className="au-section">
      <div className="au-stats-inner">
        <div style={{ fontSize: 13.5, textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500, marginBottom: 32 }}>{c.statsKicker}</div>
        <h2 className="au-h2" style={{ fontWeight: 600, lineHeight: 1.05, margin: "0 0 56px", maxWidth: 540 }}>{c.statsTitle}</h2>
        <div className="au-stats-numbers" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {stats.map((s, i) => {
            const isGreen = i % 2 === 0;
            return (
              <div key={s.label || i} style={{
                background: isGreen ? "#eef3e6" : "#e8f2f2",
                borderRadius: 16,
                padding: "24px 22px",
                display: "flex",
                flexDirection: "column",
              }}>
                <div className="au-stat-n" style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 40,
                  fontWeight: 800,
                  color: isGreen ? "#466e0e" : "#4e9597",
                  lineHeight: 0.92,
                  margin: 0,
                }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 10, color: "var(--ink)" }}>{s.label}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2, opacity: 0.7 }}>{s.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TeamSection({ A, c }) {
  // Fisher-Yates shuffle for stable randomization
  const shuffledTeam = useMemo(() => {
    const arr = c.team.map((m, i) => ({ ...m, tone: i }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [c.team]);

  return (
    <section id="team" className="au-section">
      <div className="au-team-header" style={{ display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 13.5, textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500, marginBottom: 14 }}>{c.teamKicker}</div>
          <h2 className="au-h2" style={{ fontWeight: 600, lineHeight: 1.0, margin: 0 }}>{lines(c.teamTitle)}</h2>
        </div>
        <p className="au-team-sub" style={{ maxWidth: 360, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>
          {c.teamText}
        </p>
      </div>
      <div className="au-team-mosaic" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "160px", gap: 14 }}>
        {shuffledTeam.map((m, i) => {
          const spans = { c: "span 2", r: "span 2" };
          return (
            <div key={m.name || i} className="au-team-cell" style={{ gridColumn: spans.c, gridRow: spans.r, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ flex: 1, position: "relative", overflow: "hidden", borderRadius: 16, border: "1px solid var(--line)", minHeight: 0 }}>
                {m.img
                  ? <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "block"; }} />
                  : null}
                <div style={{ width: "100%", height: "100%", display: m.img ? "none" : "block" }}>
                  <PhotoSquare tone={m.tone} style={{ borderRadius: 16, border: "none" }} />
                </div>
              </div>
              <div style={{ paddingLeft: 2, flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: A.main, fontWeight: 500 }}>{m.role}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PartnersBand({ c }) {
  return (
    <section id="partners" className="au-section">
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 22 }} className="au-partners-inner">
        <div className="au-partners-header" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, margin: 0 }}>{c.partnersTitle}</h2>
          <span style={{ fontSize: 13.5, color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>{c.partners.length} Institutionen</span>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.55, margin: "0 0 28px", color: "var(--ink-2)" }}>
          {c.partnersIntro}
        </p>
        <div className="au-partners-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {c.partners.map((p, i) => {
            const card = (
              <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 14, height: 320, display: "flex", flexDirection: "column", transition: p.url ? "opacity 0.15s, transform 0.15s" : undefined, cursor: p.url ? "pointer" : "default" }}>
                {p.logo
                  ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", overflow: "hidden", borderRadius: "12px 12px 0 0" }}>
                      <img src={p.logo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  : <div style={{ flex: 1, margin: "16px 16px 12px", background: "repeating-linear-gradient(135deg, #E5DFC9 0 8px, #EFE9D3 8px 16px)", border: "1px solid var(--line)", borderRadius: 8 }} />
                }
                <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.35, padding: "10px 16px 14px", borderTop: "1px solid var(--line-soft)" }}>{p.name}</div>
              </div>
            );

            if (p.url) {
              return (
                <a key={p.name || i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  {card}
                </a>
              );
            }
            return <div key={p.name || i}>{card}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

function ContactRow({ label, value, href }) {
  const inner = (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{value}</div>
    </div>
  );
  const shared = { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--bg)", borderRadius: 12 };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ ...shared, textDecoration: "none", color: "inherit", cursor: "pointer", transition: "opacity 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
        {inner}
      </a>
    );
  }
  return <div style={shared}>{inner}</div>;
}

function CoursesBlock({ c: content }) {
  return (
    <section id="courses" className="au-section">
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 22 }} className="au-courses-inner">
        <div className="au-partners-header" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, margin: 0 }}>{content.coursesTitle}</h2>
          <span style={{ fontSize: 13.5, color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>{content.courses.length} Kurse</span>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.55, margin: "0 0 28px", color: "var(--ink-2)" }}>
          {content.coursesIntro}
        </p>
        <div className="au-courses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {content.courses.map((c, i) => (
            <div key={`${c.name}-${i}`} style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2, marginBottom: 10 }}>{c.name}</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", margin: 0 }}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JoinBlock({ c }) {
  return (
    <section id="contact" className="au-section au-section-join">
      <div className="au-join-right" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 22, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 13.5, textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500 }}>{c.contactTitle}</div>
        <div className="au-contact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {c.contacts.map((k, i) => <ContactRow key={`${k.label}-${i}`} label={k.label} value={k.value} href={k.href} />)}
        </div>
        <div style={{ paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, color: "var(--ink-2)", fontSize: 13.5 }}>
          <Icon.Calendar width="16" height="16" />
          <span>{c.contactNote}</span>
        </div>
      </div>
    </section>
  );
}

// --- Main page ---
export default function AboutUs() {
  const isDark = useIsDarkTheme();

  const { style: CSS } = useInfoTheme();
  const A = isDark ? A_DARK : A_LIGHT;
  const c = useSiteContent("about", ABOUT_DEFAULTS);

  return (
    <div style={{ width: "100%", background: "var(--bg)", color: "var(--ink)", ...CSS }}>
      <style>{`
        .au-section { padding: 32px 56px 56px; }
        .au-section-join { padding-bottom: 80px; }
        .au-h2 { font-size: 56px; }
        .au-stats-inner { padding: 56px 56px; }
        .au-partners-inner { padding: 40px 40px 36px; }
        .au-courses-inner { padding: 40px 40px 36px; }
        .au-join-left { padding: 48px 48px 44px; }
        .au-join-right { padding: 40px 36px; }
        .au-stat-n { font-size: 76px; }
        .au-join-h2 { font-size: 64px; }

        @media (max-width: 767px) {
          .au-section { padding: 28px 16px 40px; }
          .au-section-join { padding-bottom: 48px; }
          .au-h2 { font-size: 32px; }
          .au-how-header { flex-direction: column; gap: 8px; align-items: flex-start; }
          .au-how-grid { grid-template-columns: 1fr !important; }
          .au-stats-inner { padding: 28px 20px; }
          .au-stats-header { grid-template-columns: 1fr !important; gap: 16px !important; }
          .au-stats-numbers { grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; margin-top: 32px !important; padding-top: 28px !important; }
          .au-stat-n { font-size: 44px; }
          .au-team-header { flex-direction: column; gap: 12px; align-items: flex-start; }
          .au-team-sub { max-width: 100% !important; }
          .au-team-mosaic { grid-template-columns: repeat(2, 1fr) !important; grid-auto-rows: 240px !important; }
          .au-team-cell { grid-column: auto !important; grid-row: auto !important; }
          .au-partners-inner { padding: 24px 16px 20px; }
          .au-partners-header { flex-direction: column; gap: 6px; align-items: flex-start; }
          .au-partners-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .au-courses-inner { padding: 24px 16px 20px; }
          .au-courses-grid { grid-template-columns: 1fr !important; }
          .au-join-grid { grid-template-columns: 1fr !important; }
          .au-contact-grid { grid-template-columns: 1fr !important; }
          .au-join-left { padding: 28px 24px; }
          .au-join-right { padding: 24px 20px; }
          .au-join-h2 { font-size: 36px; }
          .au-hero-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .au-img-band { grid-template-columns: 1fr !important; gap: 20px !important; }
          .au-imgband-caption { padding-top: 10px !important; }
          .au-imgband-caption > div:first-child { font-size: 16px !important; }
          .au-imgband-caption > div:last-child { font-size: 14px !important; margin-top: 4px !important; }
          .au-hero-padding { padding: 36px 16px 24px !important; }
          .au-imgband-padding { padding: 0 16px 48px !important; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .au-section { padding: 32px 32px 48px; }
          .au-h2 { font-size: 40px; }
          .au-how-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .au-stats-numbers { grid-template-columns: repeat(2, 1fr) !important; }
          .au-stat-n { font-size: 52px; }
          .au-team-mosaic { grid-template-columns: repeat(6, 1fr) !important; grid-auto-rows: 160px !important; }
          .au-partners-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .au-courses-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .au-img-band { grid-template-columns: repeat(2, 1fr) !important; }
          .au-join-grid { grid-template-columns: 1fr !important; }
          .au-join-left { padding: 36px 36px 32px; }
          .au-join-right { padding: 32px 28px; }
          .au-join-h2 { font-size: 44px; }
          .au-stats-inner { padding: 40px 36px; }
          .au-imgband-padding { padding: 16px 32px 64px !important; }
          .au-hero-padding { padding: 48px 32px 24px !important; }
        }
      `}</style>

      {/* HERO */}
      <section id="hero" className="au-hero-padding" style={{ padding: "64px 56px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-3)", fontSize: 14, marginBottom: 32 }}>
          <span style={{ width: 28, height: 1, background: "var(--ink-3)", display: "block" }} />
          <span style={{ textTransform: "uppercase", fontWeight: 500 }}>{c.heroKicker}</span>
        </div>
        <h1 style={{ fontWeight: 600, fontSize: "clamp(36px, 10vw, 168px)", lineHeight: 1.0, fontKerning: "none", fontVariantLigatures: "none", margin: "0 0 56px", wordBreak: "break-word" }}>
          {c.heroTitle1}<br />
          <span style={{ color: A.main }}>{c.heroTitle2}</span>
        </h1>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 64 }}>
          <Link to="/FAQ" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 28px", borderRadius: 16, background: A.soft, border: `1px solid ${A.main}30`, fontSize: 16, fontWeight: 600, color: A.main, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "#4a5544" : "#D4DFB8"}
              onMouseLeave={e => e.currentTarget.style.background = A.soft}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              {c.faqButton}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        </div>
        <div className="au-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "start" }}>
          <p style={{ fontSize: 22, lineHeight: 1.45, margin: 0, color: "var(--ink-2)" }}>
            <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{c.heroBrand}</strong> {c.heroIntro}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {c.pills.map((pl, i) => <Pill key={`${pl.label}-${i}`} icon={PILL_ICONS[i % PILL_ICONS.length]} label={pl.label} A={A} />)}
          </div>
        </div>
      </section>

      {/* IMAGE BAND */}
      <section id="images" className="au-imgband-padding" style={{ padding: "24px 56px 88px" }}>
        <div className="au-img-band" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {c.images.map((item, i) => (
            <div key={`${item.label}-${i}`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ aspectRatio: "16/10", borderRadius: 20, overflow: "hidden", border: "1px solid var(--line)", background: "repeating-linear-gradient(135deg, #E8E2CE 0 14px, #EFEADA 14px 28px)" }}>
                <img
                  src={item.src}
                  alt={item.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
              <div style={{ paddingLeft: 2 }} className="au-imgband-caption">
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{item.label}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{item.caption}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <HowCards c={c} />
      <StatsBlock c={c} />
      <CoursesBlock c={c} />
      <TeamSection A={A} c={c} />
      <PartnersBand c={c} />
      <JoinBlock c={c} />
    </div>
  );
}
