// Übersetzt Fehlercodes des Servers in verständliche Meldungen.
// Vorher erschienen Codes wie «category_forbidden» roh in den Hinweisen.
const MESSAGES = {
  category_forbidden: "Für diese Kategorie hast du keine Kursrechte. Ein Admin kann sie dir unter «Nutzer:innen» zuteilen.",
  course_full: "Der Kurs ist leider voll.",
  course_not_bookable: "Dieser Kurs ist abgesagt oder hat bereits begonnen.",
  course_not_found: "Dieser Kurs existiert nicht mehr.",
  already_booked: "Du hast diesen Kurs bereits gebucht.",
  cancellation_deadline_passed: "Die Stornofrist (72 Stunden vor Kursbeginn) ist abgelaufen. Melde dich bitte direkt bei der Tutor:in ab.",
  course_has_bookings: "Der Kurs hat noch Anmeldungen und kann deshalb nicht gelöscht werden.",
  max_below_participants: "Die maximale Teilnehmendenzahl darf nicht kleiner sein als die bereits angemeldeten Personen.",
  invalid_status: "Ungültiger Status.",
  forbidden: "Dafür fehlt dir die Berechtigung.",
  not_found: "Nicht gefunden. Vielleicht wurde der Eintrag inzwischen gelöscht.",
  too_many_attempts: "Zu viele Versuche. Bitte warte 15 Minuten und versuche es dann erneut.",
  "title, category, date, max_participants sind erforderlich": "Bitte fülle Titel, Kategorie, Datum und maximale Teilnehmendenzahl aus.",
  "title und category sind erforderlich": "Bitte fülle Titel und Kategorie aus.",
  "max_participants muss zwischen 1 und 500 liegen": "Die maximale Teilnehmendenzahl muss zwischen 1 und 500 liegen.",
};

// err: Fehler aus apiFetch (err.message bzw. err.data.error enthält den Code)
export function apiErrorMessage(err, fallback = "Bitte versuche es später erneut.") {
  const code = err?.data?.error || err?.message;
  return MESSAGES[code] || fallback;
}
