# Vorschlag: Texte und Fotos der Webseite selbst bearbeiten

Stand: November 2026

## Worum geht es?

Heute kann nur eine Person mit Programmierkenntnissen Texte oder Fotos auf
der Webseite ändern. Jede Änderung braucht einen Eingriff im Code und eine
neue Veröffentlichung. Das ist langsam, und es hängt an einzelnen Personen.

**Vorschlag:** Ein Bearbeitungsbereich für Admins. Dort ändert man Texte und
tauscht Fotos direkt im Browser, und die Änderung ist sofort auf der Seite.

## Wie sieht es heute aus?

| Inhalt | Wo er liegt | Wie er sich ändert |
|---|---|---|
| Texte (FAQ, Tutor:in werden, Über uns) | Fest im Programmcode | Code ändern, committen, neu veröffentlichen |
| Team-Fotos (10 Personen) | Ordner `peer-skills-lab-kurse/public/team/` | Datei austauschen, neu veröffentlichen |
| Partner-Logos (7) und Fotos (3) | Ordner `peer-skills-lab-kurse/public/` | Datei austauschen, neu veröffentlichen |
| Team-Liste, Partner-Liste, FAQ-Einträge | Listen im Code | Code ändern, neu veröffentlichen |

## Was wir vorschlagen

Alles, was sich ändern darf, kommt in die bestehende Datenbank. Die Seiten
laden ihre Inhalte von dort. Das Layout und das Design bleiben im Code und
sind nicht frei veränderbar.

**Für Admins gibt es einen neuen Menüpunkt «Inhalte»:**
- **Texte bearbeiten:** pro Seite und Abschnitt ein Formularfeld, Speichern,
  fertig.
- **Fotos austauschen:** Bild auswählen, hochladen, die Seite zeigt es sofort.
- **Listen pflegen:** Teammitglieder, Partner und FAQ-Einträge hinzufügen,
  umsortieren, ändern oder löschen.
- **Vorschau:** Änderungen zuerst ansehen, dann veröffentlichen.

**Was dafür gebraucht wird:**
- Eine neue Tabelle in der Datenbank für die Inhalte. Die Datenbank läuft
  bereits.
- Neue Schnittstellen im Backend. Schreiben dürfen nur Admins, mit derselben
  Rechteprüfung wie heute.
- Einen Speicherort für hochgeladene Fotos (siehe unten).
- Die Bearbeitungsseite im Frontend und kleine Anpassungen der bestehenden
  Seiten.

**Sicherheitsnetz:** Steht in der Datenbank noch nichts, zeigt die Seite den
heutigen Text aus dem Code. Es kann also nichts leer oder kaputt aussehen.

## Variante ohne Fotos: nur bestehende Infrastruktur

Verzichten wir zunächst auf den Foto-Upload, brauchen wir **nichts Neues in
Azure**. Texte und Listen liegen in der Datenbank, die schon läuft, und
werden über das bestehende Backend und die bestehende App geliefert. Es
entstehen keine zusätzlichen Kosten und keine neue Ressource, die jemand
betreuen muss.

Die Fotos bleiben dann wie heute im Repo. Ein Foto tauschen bleibt eine
Entwickleraufgabe. Das ist bei Team- und Partnerfotos selten nötig. Der
Foto-Upload kann später als eigene Etappe folgen, ohne dass etwas neu
gebaut werden muss.

**Empfehlung: mit der Variante ohne Fotos starten** (Etappen 1, 3 und 4).

## Wo liegen die Fotos, wenn wir sie später doch wollen?

Das ist die wichtigste technische Entscheidung. Auf Azure geht alles, was
direkt im laufenden Container gespeichert wird, bei der nächsten
Veröffentlichung verloren. Hochgeladene Fotos brauchen deshalb einen
festen Speicherort.

| Option | Vorteil | Nachteil |
|---|---|---|
| **Azure Blob Storage** (empfohlen) | Dafür gebaut, schnell, sauber getrennt von der Datenbank | Eine weitere Azure-Ressource, die einmal eingerichtet werden muss |
| In der Datenbank | Keine neue Ressource nötig | Die Datenbank wird grösser und langsamer, nicht für viele Bilder gedacht |

Bei so wenigen Bildern sind die Kosten für Blob Storage sehr klein. Die
genaue Zahl lässt sich im Azure-Portal ablesen und müsste vor dem Start
geprüft werden.

## Vorgehen in Etappen

Jede Etappe ist für sich nutzbar. Nach jeder kann man entscheiden, ob es
weitergeht.

| Etappe | Inhalt | Grober Aufwand* |
|---|---|---|
| **1. Grundlage und Texte** | Tabelle, Schnittstellen, Menüpunkt «Inhalte». Texte von «Tutor:in werden» und FAQ bearbeitbar | 2–3 Arbeitstage |
| **2. Listen** | Team, Partner und FAQ-Einträge hinzufügen, sortieren, löschen | 2–3 Arbeitstage |
| **3. Über uns und Rest** | Restliche Texte der Seite «Über uns», Vorschau-Funktion | 2–3 Arbeitstage |
| **4. Fotos (optional, später)** | Blob Storage einrichten, Upload, Team-Fotos und Partner-Logos austauschbar | 2–3 Arbeitstage |

Die Etappen 1 bis 3 laufen komplett auf der bestehenden Infrastruktur.

\* Schätzung, keine Zusage. Sie hängt davon ab, wie viele Felder am Ende
bearbeitbar sein sollen und wie viel Feinschliff gewünscht ist.

## Risiken und Grenzen

- **Falsche Eingaben:** Wer bearbeiten darf, kann auch Fehler machen. Deshalb
  die Vorschau und das Zurückfallen auf den Text aus dem Code.
- **Nur Inhalte, kein Seitenbaukasten:** Neue Abschnitte oder ein anderes
  Layout bleiben Sache des Codes.
- **Bildgrösse (nur bei Foto-Upload):** Hochgeladene Fotos müssen automatisch
  verkleinert werden, sonst lädt die Seite langsam. Das ist in Etappe 4
  eingeplant.
- **Datenschutz:** Fotos von Personen brauchen deren Einverständnis. Das ist
  eine organisatorische Frage, keine technische.
- **Mehrere Bearbeiter:innen:** Bearbeiten zwei Personen gleichzeitig
  denselben Text, gewinnt die letzte Speicherung. Bei einem kleinen Admin-Team
  ist das vertretbar.

## Was wir entscheiden müssen

1. Starten wir mit Etappe 1 (Texte von «Tutor:in werden» und FAQ)?
2. Fotos zunächst weglassen (empfohlen) oder gleich mit Upload? Falls mit
   Upload: Blob Storage (empfohlen) oder Datenbank?
3. Wer bekommt Zugriff auf «Inhalte», nur Admins oder auch Tutor:innen?
4. Reicht ein einfaches Speichern, oder soll es Entwurf und Veröffentlichen
   getrennt geben?
