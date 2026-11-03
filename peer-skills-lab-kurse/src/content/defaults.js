// Standardtexte der bearbeitbaren Infoseiten. Sie gelten, solange im
// Admin-Bereich «Inhalte» nichts gespeichert wurde, und dienen als Vorlage für
// die Struktur: Die Bearbeitungsseite und der Server kennen nur diese Felder.

export const TUTOR_WERDEN_DEFAULTS = {
  intro:
    "Das Herz des Peer Skills Lab sind unsere Tutor:innen. Einmal im Jahr rekrutieren wir deshalb neue Peer-Tutor:innen.",
  requirements: [
    {
      title: "Bestandenes 3. Studienjahr",
      body: "Du kannst dich bewerben, sobald du das 3. Studienjahr Humanmedizin erfolgreich abgeschlossen hast.",
    },
    {
      title: "Teilnahme am Didaktikkurs",
      body: "Der eintägige Didaktikkurs findet jedes Jahr im März statt und ist für alle neu rekrutierten Tutor:innen obligatorisch.",
    },
    {
      title: "Keine Erfahrung nötig",
      body: "Du brauchst keine Erfahrung im Tutorieren, irgendwo müssen alle anfangen.",
    },
  ],
  timeline: [
    {
      month: "Ende September",
      title: "Umfrage bei aktiven Tutor:innen",
      body: "Wir fragen die aktiven Tutor:innen, wer im nächsten Semester weiterhin tutorieren wird, daraus ergibt sich der Bedarf an neuen Tutor:innen.",
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
      body: "Wir schauen uns eure Bewerbungen an und melden uns für ein Treffen mit euch.",
    },
    {
      month: "März",
      title: "Didaktikkurs",
      body: "Eintägiger, obligatorischer Didaktikkurs für alle neuen Tutor:innen.",
    },
  ],
  seatsTitle: "Wie viele Tutor:innen werden gesucht?",
  seatsBody:
    "Die Anzahl der neu rekrutierten Tutor:innen wird vom Vorstand jedes Jahr individuell festgelegt, abhängig vom aktuellen Bedarf an Kursen und Kapazitäten. Es gibt also keine fixe Anzahl offener Plätze pro Jahrgang.",
  contactTitle: "Fragen zur Bewerbung?",
  contactBody:
    "Melde dich einfach bei uns, falls du Fragen zur Rekrutierung oder zum Bewerbungsverfahren hast.",
};

export const FAQ_DEFAULTS = {
  intro:
    "Hier findest du Antworten auf die häufigsten Fragen rund um das Peer Skills Lab, unsere Kurse und wie du mitmachen kannst.",
  sections: [
    {
      category: "Allgemeines",
      items: [
        {
          q: "Was ist das Peer Skills Lab?",
          a: "Wir sind ein Verein von Medizinstudierenden, bei dem du praktische Fertigkeiten mithilfe von Peers erarbeiten kannst. Zusätzlich setzen wir uns für eine bessere Lehre an der Fakultät ein und versuchen, gleiche Anstellungsbedingungen für alle studierenden Tutor:innen zu erreichen.",
        },
        {
          q: "Für wen sind die Kurse gedacht?",
          a: "Die Kurse richten sich an alle Studierenden der Humanmedizin in Bern. Du darfst unsere Kurse besuchen, sobald du den kurrikulären Kurs der Universität besucht hast. Dies gilt nicht für ausserkurriculäre Themen wie die fortgeschrittenen Nahttechniken der YSSA.",
        },
        {
          q: "Ist das Peer Skills Lab ein offizieller Teil des Studiums?",
          a: "Nein, wir sind ein weitgehend unabhängiger Verein. Unsere Kurse sind alle freiwillig. Einige kurriculäre Kurse werden jedoch von unseren Tutor:innen unterrichtet.",
        },
      ],
    },
    {
      category: "Kurse & Buchungen",
      items: [
        {
          q: "Wie buche ich einen Kurs?",
          a: "Registriere dich auf unserer Webseite und wähle einen Kurs den du buchen möchtest. So einfach ist es.",
        },
        {
          q: "Bis wann kann ich eine Buchung stornieren?",
          a: "Buchungen können bis 72 Stunden vor Kursbeginn selbstständig storniert werden. Kurzfristige Absagen aus Krankheitsgründen oder aus anderen wichtigen Gründen müssen per E-Mail an info@peerskillslab.ch erfolgen.",
        },
        {
          q: "Was passiert, wenn ein Kurs ausgebucht ist?",
          a: "Die Kurse werden wiederholt angeboten. Falls ein Kurs, der dich interessiert, ausgebucht ist, warte, bis eine unserer Tutor:innen oder Tutoren den Kurs erneut ausschreibt.",
        },
        {
          q: "Wie viel kosten die Kurse?",
          a: "Alle unsere Kurse sind für Studierende kostenlos.",
        },
        {
          q: "Wo finden die Kurse statt?",
          a: "Die Kurse finden im BISS der Uni Ziegler statt. Sollten sie an einem anderen Ort stattfinden, werden unsere Tutor:innen dies kommunizieren.",
        },
      ],
    },
    {
      category: "Tutor:innen & Mitmachen",
      items: [
        {
          q: "Wie kann ich selbst Tutor:in werden?",
          a: "Einmal im Jahr rekrutieren wir neue Peer-Tutor:innen über ein Bewerbungsverfahren mit Fragebogen und Motivationsschreiben. Alle Infos dazu findest du auf unserer Seite „Tutor:in werden“.",
        },
        {
          q: "Welche Voraussetzungen brauche ich, um zu unterrichten?",
          a: "Du kannst dich ab bestandenem 3. Studienjahr bewerben. Fix dazu gehört die Teilnahme am eintägigen Didaktikkurs im März. Details siehe „Tutor:in werden“.",
        },
        {
          q: "Wie kann ich dem Verein beitreten?",
          a: "Im Moment sind nur Tutor:innen Mitglieder unseres Vereins.",
        },
      ],
    },
  ],
};

export const ABOUT_DEFAULTS = {
  "heroKicker": "Über uns · seit 2025",
  "heroTitle1": "Peer produced",
  "heroTitle2": "proficiency.",
  "faqButton": "FAQs ansehen",
  "heroBrand": "PeerSkills Lab",
  "heroIntro": "ist ein studentisch geprägtes Lern- und Vernetzungsprojekt, welches praktische Skills in der Medizin auf verständliche und niederschwellige Weise vermittelt. Uns ist wichtig, dass Wissen auf Augenhöhe vermittelt wird: Studierende lernen besonders effektiv im Austausch mit Peers, die sich in derselben Ausbildungsphase befinden. Offenes Fragenstellen, aktives Ausprobieren und das Korrigieren von Fehlern ohne Hemmschwelle sind dabei zentral.",
  "pills": [
    {
      "label": "OSCE-fokussiert"
    },
    {
      "label": "Spaced repetition"
    },
    {
      "label": "Peer-zu-Peer"
    },
    {
      "label": "Non-profit, Verein"
    }
  ],
  "images": [
    {
      "label": "Skills Day",
      "caption": "Jährliches Skills-Fest",
      "src": "/photos/skills-day.jpg"
    },
    {
      "label": "Venenpunktion",
      "caption": "Praktische Übungsstation",
      "src": "/photos/venenpunktion.jpg"
    },
    {
      "label": "Unsere Peer-Tutor*innen",
      "caption": "Das Team hinter den Kursen",
      "src": "/photos/peer-tutorinnen.jpg"
    }
  ],
  "howKicker": "Wie es funktioniert",
  "howTitle": "Vier Prinzipien,\ndie alles tragen.",
  "steps": [
    {
      "title": "Peers lehren Peers",
      "body": "Dadurch entsteht eine hohe soziale und kognitive Kongruenz, weil Inhalte verständlich, praxisnah und ähnlich der eigenen Denkstruktur erklärt werden."
    },
    {
      "title": "Strategisch wiederholen",
      "body": "Mithilfe von Spaced Repetition werden Inhalte in zeitlich abgestuften Abständen wiederholt, damit Wissen langfristig im Gedächtnis verankert wird."
    },
    {
      "title": "OSCE- und Klinik-nah",
      "body": "Unsere Kurse orientieren sich an den Lernzielen der Universität Bern."
    },
    {
      "title": "Niedrigschwellig & offen",
      "body": "Eintragen, hingehen, üben – und wer selbst unterrichten möchte, kann sich einfach bei uns melden."
    }
  ],
  "statsKicker": "Stand heute",
  "statsTitle": "In Zahlen.",
  "stats": [
    {
      "n": "70",
      "label": "Übungseinheiten",
      "sub": "seit Gründung 2025"
    },
    {
      "n": "15",
      "label": "aktive Peer-Tutor*innen",
      "sub": "ab dem 7. Semester"
    },
    {
      "n": "9",
      "label": "Skill-Stationen",
      "sub": "von Anamnese bis ZVK"
    },
    {
      "n": "94%",
      "label": "empfehlen weiter",
      "sub": "aus 60 Feedback-Bögen"
    }
  ],
  "coursesTitle": "Unsere Kurse",
  "coursesIntro": "Ziel ist es, die praktischen Fertigkeiten zu festigen und ein fundiertes Verständnis für klinische Untersuchungen zu vermitteln.",
  "courses": [
    {
      "name": "CST Abdomen",
      "body": "Im Repetitionskurs 'CST-Abdomen' wird die Untersuchung des Abdomens wiederholt. Neben den Grundlagen der Inspektion, Auskultation, Perkussion und Palpation werden auch spezielle Untersuchungen (z. B. bei Peritonitis oder Appendizitis) thematisiert. Ziel des Kurses ist es, eure praktischen Fertigkeiten zu festigen und euch ein fundiertes Verständnis für die differenzierte Abdomenuntersuchung zu vermitteln."
    },
    {
      "name": "CST HKL",
      "body": "Im Repetitionskurs 'CST-Herzkreislauf' werden die wesentlichen Untersuchungsmethoden des Herzens und des Kreislaufsystems wiederholt und vertieft. Dabei gehen Sie alle Schritte von der Inspektion über die Perkussion bis hin zur Auskultation und Palpation durch. Das Ziel besteht darin, eure praktischen Fertigkeiten in der Untersuchung des kardiovaskulären Systems zu festigen."
    },
    {
      "name": "CST Lunge",
      "body": "Im Repetitionskurs 'CST-Lunge' wiederholen Sie die Untersuchung der Lunge und der Atemwege. Dabei gehen Sie alle Schritte von der Inspektion über die Perkussion bis hin zur Auskultation und Palpation durch. Das Ziel besteht darin, die praktischen Fertigkeiten in der Untersuchung des respiratorischen Systems zu festigen."
    },
    {
      "name": "CST Bewegungsapparat",
      "body": "Untersuchung von Gelenken und Muskeln – orientiert an häufigen OSCE-Stationen und klinischen Tests."
    },
    {
      "name": "CST Neurologie",
      "body": "Neurologische Grunduntersuchung: Reflexe, Sensibilität, Koordination und Hirnnerven strukturiert üben."
    },
    {
      "name": "CST Gynäkologie",
      "body": "Im Repetitionskurs CST-Gynäkologie werden gynäkologische Untersuchungen wiederholt. Dazu gehören die Brustuntersuchung sowie die Spekulumuntersuchung. Dabei gehen Sie alle Schritte strukturiert durch. Das Ziel besteht darin, die praktischen Fertigkeiten in der Gynäkologie zu festigen."
    },
    {
      "name": "Venenpunktion",
      "body": "In unserem Repetitionskurs zur Venenpunktion wiederholen wir die wichtigsten Grundlagen der Blutentnahme und der Anlage eines peripheren Venenkatheters. Dazu gehören auch das vorbereitende Gespräch, die Hygiene und die Technik. Ihr habt die Gelegenheit, an einem Modell zu üben. Der Kurs wird von erfahrenen Tutor:innen geleitet, die seit mehreren Jahren auch die Erstjahreskurse betreuen."
    },
    {
      "name": "POCUS Notfallsonografie",
      "body": "E-FAST ist eine schnelle Ultraschalluntersuchung bei Traumapatienten, mit der sich freie Flüssigkeit im Abdomen, im Perikard und im Thorax sowie ein Pneumothorax nachweisen lassen. Sie ist lebensrettend in der Notfallversorgung. Bei POCUS Abdomen stehen die Gallenblase, die Nieren und die Harnblase im Mittelpunkt. Mithilfe standardisierter Untersuchungsschritte werden typische Krankheitsbilder erkannt. Aufbauend auf die Kurse 'E-FAST' und 'POCUS Abdomen' vermitteln wir theoretische und praktische Ultraschallfertigkeiten anhand der Untersuchung der Aorta, der Vena cava inferior sowie der tiefen Beinvenen. Durchführung einer sonografisch gesteuerten Punktion in 'in-plane'- und 'out-of-plane'-Technik werden geübt."
    }
  ],
  "teamKicker": "Köpfe",
  "teamTitle": "Viele Peers,\nein gemeinsames Ziel.",
  "teamText": "Werde ein Teil unseres Teams! Wir sind immer auf der Suche nach motivierten Peer-Tutor*innen, die Lust haben, praktische Skills zu unterrichten. Schreib uns einfach eine Mail oder komm zu einer unserer Vereinssitzungen vorbei.",
  "team": [
    {
      "name": "Elin",
      "role": "Co-Founder",
      "img": "/team/elin.jpg"
    },
    {
      "name": "Zoe",
      "role": "Co-Founder",
      "img": "/team/zoe.jpg"
    },
    {
      "name": "Simon",
      "role": "Co-Founder",
      "img": "/team/simon.jpg"
    },
    {
      "name": "Lorenz",
      "role": "Co-Founder",
      "img": "/team/lorenz.jpg"
    },
    {
      "name": "Anabelle",
      "role": "Vorstand",
      "img": "/team/anabelle.jpg"
    },
    {
      "name": "Mira",
      "role": "Vorstand",
      "img": "/team/mira.jpg"
    },
    {
      "name": "Surya",
      "role": "Vorstand",
      "img": "/team/surya.jpg"
    },
    {
      "name": "Liam",
      "role": "Vorstand",
      "img": "/team/Liam.jpeg"
    },
    {
      "name": "Elena",
      "role": "Peer-Tutorin",
      "img": "/team/elena.jpg"
    },
    {
      "name": "Luzia",
      "role": "Peer-Tutorin",
      "img": "/team/luzia.jpg"
    }
  ],
  "partnersTitle": "Partner & Unterstützer:innen",
  "partnersIntro": "Das Projekt wird von verschiedenen Partner:innen und Unterstützer:innen gefördert, darunter die Medizinische Fakultät der Universität Bern, BiSS Bern, die Fachschaft Medizin, Alumni Med Bern, YSSA Bern, PEC Bern sowie die Direktion Lehre und Forschung der Inselgruppe. Diese Zusammenarbeit hilft uns, unsere Kurse breit zu verankern und praxisnah zu gestalten.",
  "partners": [
    {
      "name": "Medizinische Fakultät",
      "logo": "/partners/unibern.png",
      "url": "https://www.medizin.unibe.ch"
    },
    {
      "name": "BiSS Bern",
      "logo": "/partners/biss.png",
      "url": "https://cms.biss.iml.unibe.ch"
    },
    {
      "name": "Fachschaft Medizin",
      "logo": "/partners/fsmb.png",
      "url": "https://www.fsmb.ch"
    },
    {
      "name": "Alumni Med Bern",
      "logo": "/partners/logo_alumni_med_bern.png",
      "url": "https://med.alumni.unibe.ch"
    },
    {
      "name": "YSSA Bern",
      "logo": "/partners/yssa.jpg",
      "url": "https://www.yssa-bern.ch/startseite"
    },
    {
      "name": "PEC Bern",
      "logo": "/partners/pec.jpg",
      "url": "https://www.fsmb.ch/paul-ehrlich-contest/"
    },
    {
      "name": "Direktion Lehre und Forschung",
      "logo": "/partners/insel.png",
      "url": "https://inselgruppe.ch/de/die-insel-gruppe/organisation/direktion-lehre-und-forschung"
    }
  ],
  "contactTitle": "Direkt erreichen",
  "contacts": [
    {
      "label": "Allgemein",
      "value": "info@peerskillslab.ch",
      "href": "mailto:info@peerskillslab.ch"
    },
    {
      "label": "Instagram",
      "value": "@peerskillslab",
      "href": "https://www.instagram.com/peerskillslab_bern"
    },
    {
      "label": "LinkedIn",
      "value": "PeerSkills Lab",
      "href": "https://www.linkedin.com/company/112596144"
    }
  ],
  "contactNote": "Melde dich bei uns!"
};
