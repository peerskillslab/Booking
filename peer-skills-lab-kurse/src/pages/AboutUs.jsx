// @ts-nocheck
import React from "react";
import { Link } from "react-router-dom";

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
  ArrowRight: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 7 8.5-7" />
    </svg>
  ),
  Book: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 4.5h6a2 2 0 0 1 2 2V20" /><path d="M20 4.5h-6a2 2 0 0 0-2 2V20" />
      <path d="M4 4.5V20h6" /><path d="M20 4.5V20h-6" />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17" />
      <path d="M8 3.5v3M16 3.5v3" /><path d="M8 13.5l1.6 1.6L13 11.7" />
    </svg>
  ),
  Instagram: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  LinkedIn: (p) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-1.5 15.5v-5.3c0-2.1-1.1-3-2.7-3-1.2 0-1.8.7-2.1 1.1V10.5H10v8h2.7v-4.4c0-.3.1-.8.7-1.1.5-.2 1.3-.1 1.3 1.1v4.4h2.8zM7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm1.35 9.5v-8h-2.7v8h2.7z"/>
    </svg>
  ),
};

const CSS = {
  "--bg": "#FAFAF8", "--ink": "#1F2C0A", "--ink-2": "#4A5A30", "--ink-3": "#7A8A60",
  "--surface": "#F5F2E8", "--line": "#E8E2D0", "--line-soft": "#EEEAD8",
  "--sage": "#E3EAD0", "--accent": "#466E0E",
};
const A = { main: "#466E0E", soft: "#E3EAD0", ink: "#1F2C0A", deep: "#2F4A09" };

const TEAM = [
  { name: "Elin",     role: "Co-Founder", tone: 0, img: "/team/elin.jpg" },
  { name: "Zoe",      role: "Co-Founder", tone: 1, img: "/team/zoe.jpg" },
  { name: "Simon",    role: "Co-Founder", tone: 2, img: "/team/simon.jpg" },
  { name: "Lorenz",   role: "Co-Founder", tone: 3, img: "/team/lorenz.jpg" },
  { name: "Anabelle", role: "Vorstand",   tone: 4, img: "/team/anabelle.jpg" },
  { name: "Mira",     role: "Vorstand",   tone: 5, img: "/team/mira.jpg" },
  { name: "Surya",    role: "Vorstand",      tone: 0, img: "/team/surya.jpg" },
  { name: "Elena",    role: "Peer-Tutorin", tone: 1, img: "/team/elena.jpg" },
  { name: "Luzia",    role: "Peer-Tutorin", tone: 2, img: "/team/luzia.jpg" },
];

const PARTNERS = [
  { name: "Medizinische Fakultät", logo: "/partners/unibern.png", url: "https://www.medizin.unibe.ch" },
  { name: "BiSS Bern", logo: "/partners/biss.png", url: "https://cms.biss.iml.unibe.ch" },
  { name: "Fachschaft Medizin", logo: "/partners/fsmb.png", url: "https://www.fsmb.ch" },
  { name: "Alumni Med Bern", logo: "/partners/logo_alumni_med_bern.png", url: "https://med.alumni.unibe.ch" },
  { name: "YSSA Bern", logo: "/partners/yssa.jpg", url: "https://www.yssa-bern.ch/startseite" },
  { name: "PEC Bern", logo: "/partners/pec.jpg", url: "https://www.fsmb.ch/paul-ehrlich-contest/" },
  { name: "Direktion Lehre und Forschung", logo: "/partners/insel.png", url: "https://inselgruppe.ch/de/die-insel-gruppe/organisation/direktion-lehre-und-forschung" },
];

const COURSES = [
  { name: "CST Abdomen",           icon: Icon.Stethoscope, body: "Im Repetitionskurs 'CST-Abdomen' wird die Untersuchung des Abdomens wiederholt. Neben den Grundlagen der Inspektion, Auskultation, Perkussion und Palpation werden auch spezielle Untersuchungen (z. B. bei Peritonitis oder Appendizitis) thematisiert. Ziel des Kurses ist es, eure praktischen Fertigkeiten zu festigen und euch ein fundiertes Verständnis für die differenzierte Abdomenuntersuchung zu vermitteln." },
  { name: "CST HKL",               icon: Icon.Heart,       body: "Im Repetitionskurs 'CST-Herzkreislauf' werden die wesentlichen Untersuchungsmethoden des Herzens und des Kreislaufsystems wiederholt und vertieft. Dabei gehen Sie alle Schritte von der Inspektion über die Perkussion bis hin zur Auskultation und Palpation durch. Das Ziel besteht darin, eure praktischen Fertigkeiten in der Untersuchung des kardiovaskulären Systems zu festigen." },
  { name: "CST Lunge",             icon: Icon.Stethoscope, body: "Im Repetitionskurs 'CST-Lunge' wiederholen Sie die Untersuchung der Lunge und der Atemwege. Dabei gehen Sie alle Schritte von der Inspektion über die Perkussion bis hin zur Auskultation und Palpation durch. Das Ziel besteht darin, die praktischen Fertigkeiten in der Untersuchung des respiratorischen Systems zu festigen." },
  { name: "CST Bewegungsapparat",  icon: Icon.Users,       body: "Untersuchung von Gelenken und Muskeln – orientiert an häufigen OSCE-Stationen und klinischen Tests." },
  { name: "CST Neurologie",        icon: Icon.Sparkle,     body: "Neurologische Grunduntersuchung: Reflexe, Sensibilität, Koordination und Hirnnerven strukturiert üben." },
  { name: "CST Gynäkologie",       icon: Icon.Heart,       body: "Im Repetitionskurs CST-Gynäkologie werden gynäkologische Untersuchungen wiederholt. Dazu gehören die Brustuntersuchung sowie die Spekulumuntersuchung. Dabei gehen Sie alle Schritte strukturiert durch. Das Ziel besteht darin, die praktischen Fertigkeiten in der Gynäkologie zu festigen." },
  { name: "Venenpunktion",         icon: Icon.Stethoscope, body: "In unserem Repetitionskurs zur Venenpunktion wiederholen wir die wichtigsten Grundlagen der Blutentnahme und der Anlage eines peripheren Venenkatheters. Dazu gehören auch das vorbereitende Gespräch, die Hygiene und die Technik. Ihr habt die Gelegenheit, an einem Modell zu üben. Der Kurs wird von erfahrenen Tutor:innen geleitet, die seit mehreren Jahren auch die Erstjahreskurse betreuen." },
  { name: "POCUS Notfallsonografie", icon: Icon.Sparkle,   body: "E-FAST ist eine schnelle Ultraschalluntersuchung bei Traumapatienten, mit der sich freie Flüssigkeit im Abdomen, im Perikard und im Thorax sowie ein Pneumothorax nachweisen lassen. Sie ist lebensrettend in der Notfallversorgung. Bei POCUS Abdomen stehen die Gallenblase, die Nieren und die Harnblase im Mittelpunkt. Mithilfe standardisierter Untersuchungsschritte werden typische Krankheitsbilder erkannt. Aufbauend auf die Kurse 'E-FAST' und 'POCUS Abdomen' vermitteln wir theoretische und praktische Ultraschallfertigkeiten anhand der Untersuchung der Aorta, der Vena cava inferior sowie der tiefen Beinvenen. Durchführung einer sonografisch gesteuerten Punktion in 'in-plane'- und 'out-of-plane'-Technik werden geübt." },
];

const TONE_PAIRS = [
  ["#E5DFC9","#D5CCAB"], ["#DDE2CB","#C8D1AA"], ["#E8DEC8","#D6BF9A"],
  ["#D7DDC8","#BFC9A4"], ["#EBE2CF","#DAC8A8"], ["#D5DCCA","#BAC4A1"],
];

function PhotoPlaceholder({ ratio = "4/3", label = "Foto", round = 14 }) {
  return (
    <div style={{ aspectRatio: ratio, borderRadius: round, background: "repeating-linear-gradient(135deg, #E8E2CE 0 14px, #EFEADA 14px 28px)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
      {label && <span style={{ background: "var(--bg)", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)", fontFamily: "ui-monospace, SF Mono, monospace" }}>{label}</span>}
    </div>
  );
}

function PhotoSquare({ tone = 0, style: sx }) {
  const [a, b] = TONE_PAIRS[tone % TONE_PAIRS.length];
  return <div style={{ width: "100%", height: "100%", borderRadius: 16, background: `repeating-linear-gradient(135deg, ${a} 0 12px, ${b} 12px 24px)`, border: "1px solid var(--line)", ...sx }} />;
}

function Pill({ icon: I, label }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 14.5, fontWeight: 500, color: "var(--ink)" }}>
      <I width="18" height="18" stroke="currentColor" /><span>{label}</span>
    </div>
  );
}

function HowCards() {
  const steps = [
    { n: "01", icon: Icon.Users,       title: "Peers lehren Peers",        body: "Studierende lernen besonders effektiv im Austausch mit Peers, die sich in derselben Ausbildungsphase befinden. Lernen auf Augenhöhe ermöglicht offenes Fragenstellen, aktives Ausprobieren und das Korrigieren von Fehlern ohne Hemmschwelle. Dadurch entsteht eine hohe soziale Kongruenz, während die kognitive Kongruenz durch verständliche, nah an der eigenen Denkstruktur liegende Erklärungen unterstützt wird." },
    { n: "02", icon: Icon.Repeat,      title: "Strategisch wiederholen",   body: "Spaced Repetition Learning ist eine Lernmethode, bei der Inhalte in zeitlich abgestuften Abständen wiederholt werden. Statt einmalig intensiv zu lernen, wird der Stoff mehrfach aktiv abgerufen, wobei die Intervalle zwischen den Wiederholungen zunehmend grösser werden. Dadurch wird die Vergessenskurve gezielt genutzt und Wissen langfristig im Gedächtnis verankert. Die Methode ist besonders effektiv für nachhaltiges Lernen und Prüfungsvorbereitung." },
    { n: "03", icon: Icon.Stethoscope, title: "OSCE- und Klinik-nah",      body: "Jeder Kurs orientiert sich an den Lernzielen der Universität Bern und ergänzt das bestehende Curriculum somit gezielt." },
    { n: "04", icon: Icon.Sparkle,     title: "Niedrigschwellig & offen",  body: "Eintragen, hingehen, üben. Wer Lust hat selbst zu unterrichten, schreibt uns einfach!" },
  ];
  return (
    <section className="au-section">
      <div className="au-how-header" style={{ display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 32 }}>
        <h2 className="au-h2" style={{ fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.0, margin: 0, maxWidth: 720 }}>
          Vier Prinzipien,<br />die alles tragen.
        </h2>
        <div style={{ fontSize: 13.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500, color: "var(--ink-3)" }}>Wie es funktioniert</div>
      </div>
      <div className="au-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {steps.map(s => {
          const I = s.icon;
          return (
            <div key={s.n} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column", gap: 18, minHeight: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: A.soft, color: A.deep, display: "flex", alignItems: "center", justifyContent: "center" }}><I width="22" height="22" /></div>
                <span style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 500 }}>{s.n}</span>
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 600, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{s.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: 0, color: "var(--ink-2)" }}>{s.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StatsBlock() {
  const stats = [
    { n: "70", label: "Übungseinheiten",        sub: "seit Gründung 2025" },
    { n: "15",    label: "aktive Peer-Tutor*innen", sub: "ab dem 5. Semester" },
    { n: "9",     label: "Skill-Stationen",         sub: "von Anamnese bis ZVK" },
    { n: "94%",    label: "empfehlen weiter",        sub: "aus 60 Feedback-Bögen" },
  ];
  return (
    <section className="au-section">
      <div style={{ background: A.ink, color: "#F5F2E8", borderRadius: 22, position: "relative", overflow: "hidden" }} className="au-stats-inner">
        <div style={{ position: "absolute", top: -100, right: -100, width: 360, height: 360, borderRadius: "50%", background: A.main, opacity: 0.25 }} />
        <div style={{ position: "absolute", bottom: -120, left: -40, width: 220, height: 220, borderRadius: "50%", background: A.main, opacity: 0.15 }} />
        <div className="au-stats-header" style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 13.5, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.65, fontWeight: 500, marginBottom: 14 }}>Stand heute</div>
            <h2 className="au-h2" style={{ fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.05, margin: 0, maxWidth: 540 }}>In Zahlen,</h2>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, opacity: 0.85 }}>
            Wir fragen nur, was uns hilft zu sehen, ob die Kurse wirklich gebucht werden und ob die Teilnehmenden danach das Gefühl haben, etwas mitgenommen zu haben.
          </p>
        </div>
        <div className="au-stats-numbers" style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginTop: 56, paddingTop: 40, borderTop: "1px solid rgba(245,242,232,0.18)" }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div className="au-stat-n" style={{ fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 0.92 }}>{s.n}</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginTop: 14 }}>{s.label}</div>
              <div style={{ fontSize: 13.5, opacity: 0.65, marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section className="au-section">
      <div className="au-team-header" style={{ display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 13.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500, marginBottom: 14 }}>Köpfe</div>
          <h2 className="au-h2" style={{ fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.0, margin: 0 }}>Viele Peers,<br />ein gemeinsames Ziel.</h2>
        </div>
        <p className="au-team-sub" style={{ maxWidth: 360, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>
          Werde ein Teil unseres Teams! Wir sind immer auf der Suche nach motivierten Peer-Tutor*innen, die Lust haben, praktische Skills zu unterrichten. Schreib uns einfach eine Mail oder komm zu einer unserer Vereinssitzungen vorbei.
        </p>
      </div>
      <div className="au-team-mosaic" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "160px", gap: 14 }}>
        {TEAM.map((m, i) => {
          const spans = { c: "span 4", r: "span 2" };
          return (
            <div key={i} className="au-team-cell" style={{ gridColumn: spans.c, gridRow: spans.r, display: "flex", flexDirection: "column", gap: 10 }}>
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

function PartnersBand() {
  return (
    <section className="au-section">
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 22 }} className="au-partners-inner">
        <div className="au-partners-header" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.015em", margin: 0 }}>Partner & Unterstützer:innen</h2>
          <span style={{ fontSize: 13.5, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>6 Institutionen</span>
        </div>
        <div className="au-partners-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {PARTNERS.map((p, i) => {
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
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  {card}
                </a>
              );
            }
            return <div key={i}>{card}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

function ContactRow({ label, value, icon: I, href }) {
  const inner = (
    <>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink)", flexShrink: 0 }}><I width="18" height="18" /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 14.5, fontWeight: 500 }}>{value}</div>
      </div>
    </>
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

function CoursesBlock() {
  return (
    <section className="au-section">
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 22 }} className="au-courses-inner">
        <div className="au-partners-header" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28 }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.015em", margin: 0 }}>Unsere Kurse</h2>
          <span style={{ fontSize: 13.5, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>8 Kurse</span>
        </div>
        <div className="au-courses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {COURSES.map((c, i) => {
            const I = c.icon;
            return (
              <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 16, padding: "28px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: A.soft, color: A.deep, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <I width="22" height="22" />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 10 }}>{c.name}</div>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", margin: 0 }}>{c.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function JoinBlock() {
  return (
    <section className="au-section au-section-join">
      <div className="au-join-right" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 22, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 13.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500 }}>Direkt erreichen</div>
        <div className="au-contact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <ContactRow label="Allgemein"  value="info@peerskillslab.ch" icon={Icon.Mail}      href="mailto:info@peerskillslab.ch" />
          <ContactRow label="Instagram"  value="@peerskillslab"         icon={Icon.Instagram} href="https://www.instagram.com/peerskillslab_bern" />
          <ContactRow label="LinkedIn"   value="PeerSkills Lab"         icon={Icon.LinkedIn}  href="https://www.linkedin.com/company/112596144" />
        </div>
        <div style={{ paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, color: "var(--ink-2)", fontSize: 13.5 }}>
          <Icon.Calendar width="16" height="16" />
          <span>Melde dich bei uns!</span>
        </div>
      </div>
    </section>
  );
}

// --- Main page ---
export default function AboutUs() {
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
      <section className="au-hero-padding" style={{ padding: "64px 56px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-3)", fontSize: 14, marginBottom: 32 }}>
          <span style={{ width: 28, height: 1, background: "var(--ink-3)", display: "block" }} />
          <span style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}>Über uns · seit 2025</span>
        </div>
        <h1 style={{ fontWeight: 600, fontSize: "clamp(36px, 10vw, 168px)", lineHeight: 0.88, letterSpacing: "-0.03em", fontKerning: "none", fontVariantLigatures: "none", margin: "0 0 56px", wordBreak: "break-word" }}>
          Peer produced<br />
          <span style={{ color: A.main }}>proficiency.</span>
        </h1>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 64 }}>
          <Link to="/FAQ" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 28px", borderRadius: 16, background: A.soft, border: `1px solid ${A.main}30`, fontSize: 16, fontWeight: 600, color: A.main, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "#D4DFB8"}
              onMouseLeave={e => e.currentTarget.style.background = A.soft}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              FAQs ansehen
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        </div>
        <div className="au-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "start" }}>
          <p style={{ fontSize: 22, lineHeight: 1.45, margin: 0, color: "var(--ink-2)" }}>
            Wir sind <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Peer Skills Lab</strong> — ein Verein von Medizinstudierenden, der praktische Fertigkeiten mithilfe von Peers strategisch wiederholt. Damit OSCEs entspannter werden und der erste Tag auf Station weniger fremd anfühlt.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <Pill icon={Icon.Stethoscope} label="OSCE-fokussiert" />
            <Pill icon={Icon.Repeat}      label="Spaced repetition" />
            <Pill icon={Icon.Users}       label="Peer-zu-Peer" />
            <Pill icon={Icon.Heart}       label="Non-profit, Verein" />
          </div>
        </div>
      </section>

      {/* IMAGE BAND */}
      <section className="au-imgband-padding" style={{ padding: "24px 56px 88px" }}>
        <div className="au-img-band" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            { label: "Skills Day",              caption: "Jährliches Skills-Fest",       src: "/photos/skills-day.jpg" },
            { label: "Venenpunktion",           caption: "Praktische Übungsstation",     src: "/photos/venenpunktion.jpg" },
            { label: "Unsere Peer-Tutor*innen", caption: "Das Team hinter den Kursen",  src: "/photos/peer-tutorinnen.jpg" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

      <HowCards />
      <StatsBlock />
      <CoursesBlock />
      <TeamSection />
      <PartnersBand />
      <JoinBlock />
    </div>
  );
}
