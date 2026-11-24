import { formatCourseDate } from "@/lib/courseUtils";

// Zeilen für den Export «Teilnehmende»: Kopfzeile, dann eine Zeile pro
// bestätigter Buchung. Bewusst nur Name und Studienjahr, keine E-Mail.
export function participantRows(courses, bookings, monthLabel) {
  const byCourse = new Map();
  bookings.forEach((b) => {
    if (!byCourse.has(b.course_id)) byCourse.set(b.course_id, []);
    byCourse.get(b.course_id).push(b);
  });
  const sorted = [...courses].sort((a, b) =>
    `${a.date || ""} ${a.time || ""}`.localeCompare(`${b.date || ""} ${b.time || ""}`));
  const rows = [["Monat", "Kursname", "Kategorie", "Tutor:in", "Datum", "Zeit", "Name", "Studienjahr"]];
  sorted.forEach((c) => {
    [...(byCourse.get(c.id) || [])]
      .sort((a, b) => (a.user_name || "").localeCompare(b.user_name || "", "de"))
      .forEach((b) => rows.push([
        monthLabel, c.title || "—", c.category || "—", c.instructor || "—",
        formatCourseDate(c.date), c.time || "—", b.user_name || "—", b.studienjahr ?? "—",
      ]));
  });
  return rows;
}
