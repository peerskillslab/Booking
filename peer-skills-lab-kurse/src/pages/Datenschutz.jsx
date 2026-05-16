import React from "react";

export default function Datenschutz() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. Allgemeine Hinweise</h2>
        <p className="text-muted-foreground">Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. In dieser Datenschutzerklärung informieren wir Sie darüber, welche personenbezogenen Daten beim Besuch dieser Webseite erhoben und wie diese verwendet werden.</p>
        <p className="text-muted-foreground">Diese Webseite richtet sich an Nutzerinnen und Nutzer in der Schweiz und unterliegt dem schweizerischen Datenschutzgesetz (DSG).</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. Verantwortliche Stelle</h2>
        <p className="text-muted-foreground">
          Peer Skills Lab<br />
          3010 Bern<br />
          Schweiz<br /><br />
          E-Mail: info@peerskillslab.ch
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. Erhebung und Verarbeitung personenbezogener Daten</h2>
        <p className="text-muted-foreground">Beim Besuch dieser Webseite können personenbezogene Daten erhoben werden. Personenbezogene Daten sind Informationen, mit denen eine Person identifiziert werden kann.</p>
        <p className="text-muted-foreground">Dies betrifft insbesondere Daten, die Sie uns freiwillig über das Buchungssystem für Kurse mitteilen, beispielsweise:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Vorname und Nachname</li>
          <li>E-Mail-Adresse</li>
          <li>Studienbezogene Angaben</li>
          <li>Buchungsinformationen</li>
        </ul>
        <p className="text-muted-foreground">Die Daten werden ausschliesslich zur Organisation und Durchführung der angebotenen Kurse verwendet.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. Buchungssystem</h2>
        <p className="text-muted-foreground">Für die Anmeldung zu Kursen werden die von Ihnen eingegebenen Daten verarbeitet, um:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Kursbuchungen zu verwalten</li>
          <li>Teilnehmerlisten zu führen</li>
          <li>organisatorische Informationen zu versenden</li>
        </ul>
        <p className="text-muted-foreground">Die Nutzung der Kurse ist für Studierende kostenlos.</p>
        <p className="text-muted-foreground">Ihre Daten werden nicht an Dritte verkauft oder zu Werbezwecken verwendet.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. Hosting</h2>
        <p className="text-muted-foreground">Diese Webseite wird bei Hostpoint gehostet. Beim Besuch der Webseite werden durch den Hostinganbieter automatisch technische Informationen in sogenannten Server-Logfiles gespeichert. Dazu gehören beispielsweise:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>IP-Adresse</li>
          <li>Datum und Uhrzeit des Zugriffs</li>
          <li>verwendeter Browser</li>
          <li>Betriebssystem</li>
          <li>aufgerufene Seiten</li>
        </ul>
        <p className="text-muted-foreground">Diese Daten dienen der technischen Sicherheit und dem stabilen Betrieb der Webseite.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. Cookies</h2>
        <p className="text-muted-foreground">Diese Webseite verwendet nur technisch notwendige Cookies, soweit dies für den Betrieb der Seite erforderlich ist.</p>
        <p className="text-muted-foreground">Es werden keine Analyse-, Tracking- oder Marketing-Cookies eingesetzt.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">7. Weitergabe von Daten</h2>
        <p className="text-muted-foreground">Personenbezogene Daten werden grundsätzlich nicht an Dritte weitergegeben, ausser wenn dies gesetzlich vorgeschrieben ist oder zur Durchführung der angebotenen Leistungen notwendig ist.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">8. Datensicherheit</h2>
        <p className="text-muted-foreground">Wir treffen angemessene technische und organisatorische Sicherheitsmassnahmen, um Ihre personenbezogenen Daten vor Verlust, Missbrauch oder unberechtigtem Zugriff zu schützen.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">9. Rechte der betroffenen Personen</h2>
        <p className="text-muted-foreground">Nach dem schweizerischen Datenschutzgesetz haben Sie das Recht:</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>Auskunft über gespeicherte personenbezogene Daten zu erhalten</li>
          <li>die Berichtigung unrichtiger Daten zu verlangen</li>
          <li>die Löschung Ihrer Daten zu verlangen, sofern keine gesetzliche Aufbewahrungspflicht besteht</li>
        </ul>
        <p className="text-muted-foreground">Anfragen hierzu können an die oben genannte Kontaktadresse gerichtet werden.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">10. Änderungen</h2>
        <p className="text-muted-foreground">Wir behalten uns vor, diese Datenschutzerklärung jederzeit anzupassen, damit sie den aktuellen rechtlichen Anforderungen entspricht oder Änderungen unserer Leistungen berücksichtigt.</p>
      </section>

      <p className="text-sm text-muted-foreground pt-4 border-t border-border">Stand: Mai 2026</p>
    </div>
  );
}
