// Zugriffsregeln pro Datensatz (ursprünglich aus den Base44-Entitäten übernommen)

function canReadCourse(user, course) {
  if (!course) return false;
  if (course.status === 'active') return true;
  if (!user) return false;
  // Abgesagte und abgeschlossene Kurse sehen alle Eingeloggten: Wer gebucht
  // hat, soll in «Meine Buchungen» erkennen, dass der Kurs abgesagt wurde.
  if (course.status === 'cancelled' || course.status === 'completed') return true;
  // Entwürfe nur die Tutor:in, wer ihn angelegt hat, und Admins
  return user.role === 'admin' || course.created_by === user.email || ownsCourse(user, course);
}

// Bearbeiten und Löschen darf die Tutor:in des Kurses (siehe ownsCourse), nicht
// mehr die Person, die ihn ursprünglich angelegt hat. So gilt überall dieselbe
// Regel wie in «Meine Kurse», auch nach einem Tutorwechsel.
function canWriteCourse(user, course) {
  if (!user) return false;
  return user.role === 'admin' || ownsCourse(user, course);
}

function canDeleteCourse(user, course) {
  return canWriteCourse(user, course);
}

// Tutor:in des Kurses. `course` darf {created_by, instructor_email, instructor}
// sein. instructor_email ist die maßgebliche Verknüpfung und wandert bei einem
// Tutorwechsel mit; created_by deckt Altbestände ab, der Namensvergleich nur
// noch Kurse ohne aufgelöste Adresse.
function ownsCourse(user, course) {
  if (!user || !course) return false;
  if (user.role !== 'tutor' && user.role !== 'admin') return false;
  if (course.instructor_email) return course.instructor_email === user.email;
  return (
    course.created_by === user.email ||
    (!!user.full_name && course.instructor === user.full_name)
  );
}

function canReadBooking(user, booking, course) {
  if (!user) return false;
  if (booking.user_email === user.email || user.role === 'admin') return true;
  return ownsCourse(user, course);
}

function canWriteBooking(user, booking, course) {
  if (!user) return false;
  if (booking.user_email === user.email || user.role === 'admin') return true;
  return ownsCourse(user, course);
}

function canReadTemplate(user) {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'tutor';
}

function canWriteTemplate(user, template) {
  if (!user) return false;
  return template.created_by === user.email || user.role === 'admin';
}

function isAdmin(user) {
  return user && user.role === 'admin';
}

module.exports = {
  canReadCourse, canWriteCourse, canDeleteCourse,
  ownsCourse, isAdmin,
  canReadBooking, canWriteBooking,
  canReadTemplate, canWriteTemplate,
};
