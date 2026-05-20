// @ts-nocheck
import React from "react";

export default function Impressum() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Impressum</h1>

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
        <h2 className="text-xl font-semibold">Verantwortlich für den Inhalt</h2>
        <p className="text-muted-foreground">
          Peer Skills Lab<br />
          Simon Schneider
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Haftungsausschluss</h2>
        <p className="text-muted-foreground">Die Inhalte dieser Webseite wurden mit grösstmöglicher Sorgfalt erstellt. Dennoch übernehmen wir keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Inhalte.</p>
        <p className="text-muted-foreground">Haftungsansprüche gegen den Betreiber wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen entstanden sind, werden ausgeschlossen, soweit gesetzlich zulässig.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Urheberrechte</h2>
        <p className="text-muted-foreground">Die Inhalte und Werke auf dieser Webseite unterliegen dem schweizerischen Urheberrecht. Jegliche Vervielfältigung, Bearbeitung oder Verbreitung ausserhalb der gesetzlichen Grenzen bedarf der vorherigen schriftlichen Zustimmung des jeweiligen Rechteinhabers.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Hosting</h2>
        <p className="text-muted-foreground">Diese Webseite wird bei Hostpoint gehostet.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Kontakt</h2>
        <p className="text-muted-foreground">Bei Fragen zu dieser Webseite oder den angebotenen Kursen kontaktieren Sie uns bitte per E-Mail unter:</p>
        <p className="text-muted-foreground">info@peerskillslab.ch</p>
      </section>
    </div>
  );
}
