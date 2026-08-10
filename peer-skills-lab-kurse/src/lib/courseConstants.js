// Inhaltliche Vorgaben je Kategorie — zugleich die kanonische Kategorienliste.
export const CATEGORY_DEFAULTS = {
  "CST Abdomen": {
    short_description: "Repetition der Abdomenuntersuchung",
    description: "Im Repetitionskurs 'CST-Abdomen' wird die Untersuchung des Abdomens wiederholt. Neben den Grundlagen der Inspektion, Auskultation, Perkussion und Palpation werden auch spezielle Untersuchungen (z. B. bei Peritonitis oder Appendizitis) thematisiert. Ziel des Kurses ist es, eure praktischen Fertigkeiten zu festigen und euch ein fundiertes Verständnis für die differenzierte Abdomenuntersuchung zu vermitteln.",
    level: "Alle Studienjahre",
  },
  "CST HKL": {
    short_description: "Herzkreislauf-Untersuchung verstehen und üben",
    description: "Im Repetitionskurs 'CST-Herzkreislauf' werden die wesentlichen Untersuchungsmethoden des Herzens und des Kreislaufsystems wiederholt und vertieft. Dabei gehen Sie alle Schritte von der Inspektion über die Perkussion bis hin zur Auskultation und Palpation durch. Das Ziel besteht darin, eure praktischen Fertigkeiten in der Untersuchung des kardiovaskulären Systems zu festigen.",
    level: "Alle Studienjahre",
  },
  "CST Gynäkologie": {
    short_description: "Gynäkologische Untersuchungen sicher durchführen",
    description: "Im Repetitionskurs CST-Gynäkologie werden gynäkologische Untersuchungen wiederholt. Dazu gehören die Brustuntersuchung sowie die Spekulumuntersuchung. Dabei gehen Sie alle Schritte strukturiert durch. Das Ziel besteht darin, die praktischen Fertigkeiten in der Gynäkologie zu festigen.",
    level: "Alle Studienjahre",
  },
  "CST Lunge": {
    short_description: "Lungenauskultation und Atemwegsuntersuchung",
    description: "Im Repetitionskurs 'CST-Lunge' wiederholen Sie die Untersuchung der Lunge und der Atemwege. Dabei gehen Sie alle Schritte von der Inspektion über die Perkussion bis hin zur Auskultation und Palpation durch. Das Ziel besteht darin, die praktischen Fertigkeiten in der Untersuchung des respiratorischen Systems zu festigen.",
    level: "Alle Studienjahre",
  },
  "CST Neurologie": {
    short_description: "Neurologische Grunduntersuchung systematisch üben",
    description: "Neurologische Grunduntersuchung: Reflexe, Sensibilität, Koordination und Hirnnerven strukturiert üben.",
    level: "Alle Studienjahre",
  },
  "CST Bewegungsapparat": {
    short_description: "Gelenk- und Muskeluntersuchungen trainieren",
    description: "Untersuchung von Gelenken und Muskeln – orientiert an häufigen OSCE-Stationen und klinischen Tests.",
    level: "Alle Studienjahre",
  },
  "POCUS": {
    short_description: "Notfallsonografie und Ultraschallfertigkeiten",
    description: "E-FAST ist eine schnelle Ultraschalluntersuchung bei Traumapatienten, mit der sich freie Flüssigkeit im Abdomen, im Perikard und im Thorax sowie ein Pneumothorax nachweisen lassen. Sie ist lebensrettend in der Notfallversorgung. Bei POCUS Abdomen stehen die Gallenblase, die Nieren und die Harnblase im Mittelpunkt. Mithilfe standardisierter Untersuchungsschritte werden typische Krankheitsbilder erkannt. Aufbauend auf die Kurse 'E-FAST' und 'POCUS Abdomen' vermitteln wir theoretische und praktische Ultraschallfertigkeiten anhand der Untersuchung der Aorta, der Vena cava inferior sowie der tiefen Beinvenen. Durchführung einer sonografisch gesteuerten Punktion in 'in-plane'- und 'out-of-plane'-Technik werden geübt.",
    level: "Alle Studienjahre",
  },
  "Venenpunktion": {
    short_description: "Blutentnahme und periphere Venenkatheter anlegen",
    description: "In unserem Repetitionskurs zur Venenpunktion wiederholen wir die wichtigsten Grundlagen der Blutentnahme und der Anlage eines peripheren Venenkatheters. Dazu gehören auch das vorbereitende Gespräch, die Hygiene und die Technik. Ihr habt die Gelegenheit, an einem Modell zu üben. Der Kurs wird von erfahrenen Tutor:innen geleitet, die seit mehreren Jahren auch die Erstjahreskurse betreuen.",
    level: "Alle Studienjahre",
  },
  "YSSA": {
    short_description: "",
    description: "",
    level: "ab 4. Studienjahr",
  },
};

// Abgeleitet, damit Liste und Vorgaben nicht auseinanderlaufen koennen.
export const CATEGORIES = Object.keys(CATEGORY_DEFAULTS);

export const LEVELS = [
  "Alle Studienjahre",
  "ab 1. Studienjahr",
  "ab 2. Studienjahr",
  "ab 3. Studienjahr",
  "ab 4. Studienjahr",
  "ab 5. Studienjahr",
  "ab 6. Studienjahr"
];
