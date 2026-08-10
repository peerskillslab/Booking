// Row-Level Security — mirrors the rules in base44/entities/*.jsonc

function canReadCourse(user, course) {
  if (!course) return false;
  if (course.status === 'active') return true;
  if (!user) return false;
  return course.created_by === user.email || user.role === 'admin';
}

function canWriteCourse(user, course) {
  if (!user) return false;
  return course.created_by === user.email || user.role === 'admin';
}

function canDeleteCourse(user, course) {
  if (!user) return false;
  return course.created_by === user.email || user.role === 'admin';
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

// `course` ist der zugehörige Kurs ({created_by, instructor}). Die Zuordnung
// über den Kurs statt über feedback.instructor === user.full_name verhindert,
// dass zwei gleichnamige Tutor:innen gegenseitig ihr Feedback lesen — und dass
// jemand sich per PATCH /auth/me in einen fremden Namen umbenennt.
function canReadFeedback(user, feedback, course) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return ownsCourse(user, course);
}

function canWriteFeedback(user, feedback) {
  if (!user) return false;
  return feedback.user_email === user.email || user.role === 'admin';
}

module.exports = {
  canReadCourse, canWriteCourse, canDeleteCourse,
  ownsCourse, isAdmin,
  canReadBooking, canWriteBooking,
  canReadTemplate, canWriteTemplate,
  canReadFeedback, canWriteFeedback,
};
