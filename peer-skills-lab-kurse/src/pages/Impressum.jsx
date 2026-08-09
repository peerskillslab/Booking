// @ts-nocheck
import React from "react";

export default function Impressum() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8" style={{ fontFamily: "var(--psl-font, -apple-system, sans-serif)" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 0 }}>Impressum</h1>

      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Angaben gemäss schweizerischem Recht</p>
        <p className="text-muted-foreground">
          Peer Skills Lab<br />
          Simon Schneider<br />
          3010 Bern<br />
          Schweiz<br /><br />
          E-Mail: info@peerskillslab.ch
        </p>
      </section>

      <section className="space-y-2">
        <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Verantwortlich für den Inhalt</h2>
        <p className="text-muted-foreground">
          Peer Skills Lab<br />
          Simon Schneider
        </p>
      </section>

      <section className="space-y-2">
        <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Haftungsausschluss</h2>
        <p className="text-muted-foreground">Die Inhalte dieser Webseite wurden mit grösstmöglicher Sorgfalt erstellt. Dennoch übernehmen wir keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Inhalte.</p>
        <p className="text-muted-foreground">Haftungsansprüche gegen den Betreiber wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen entstanden sind, werden ausgeschlossen, soweit gesetzlich zulässig.</p>
      </section>

      <section className="space-y-2">
        <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Urheberrechte</h2>
        <p className="text-muted-foreground">Die Inhalte und Werke auf dieser Webseite unterliegen dem schweizerischen Urheberrecht. Jegliche Vervielfältigung, Bearbeitung oder Verbreitung ausserhalb der gesetzlichen Grenzen bedarf der vorherigen schriftlichen Zustimmung des jeweiligen Rechteinhabers.</p>
      </section>

      <section className="space-y-2">
        <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Hosting</h2>
        <p className="text-muted-foreground">Diese Webseite wird bei Hostpoint gehostet.</p>
      </section>

      <section className="space-y-2">
        <h2 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Kontakt</h2>
        <p className="text-muted-foreground">Bei Fragen zu dieser Webseite oder den angebotenen Kursen kontaktieren Sie uns bitte per E-Mail unter:</p>
        <p className="text-muted-foreground">info@peerskillslab.ch</p>
      </section>
    </div>
  );
}
