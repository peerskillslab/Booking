// Row-Level Security — mirrors the rules in base44/entities/*.jsonc

function canReadCourse(user, course) {
  if (!course) return false;
  if (course.status === 'active') return true;
  if (!user) return false;
  return course.created_by === user.email || user.role === 'admin';
}

function canWriteCourse(user, course) {
  if (!user) return false;
  return (
    course.created_by === user.email ||
    user.role === 'admin' ||
    user.role === 'tutor'
  );
}

function canDeleteCourse(user, course) {
  if (!user) return false;
  return course.created_by === user.email || user.role === 'admin';
}

function canReadBooking(user, booking) {
  if (!user) return false;
  return booking.user_email === user.email || user.role === 'admin';
}

function canWriteBooking(user, booking) {
  if (!user) return false;
  return booking.user_email === user.email || user.role === 'admin';
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

function canReadFeedback(user, feedback) {
  if (!user) return false;
  return user.role === 'admin' || feedback.instructor === user.full_name;
}

function canWriteFeedback(user, feedback) {
  if (!user) return false;
  return feedback.user_email === user.email || user.role === 'admin';
}

module.exports = {
  canReadCourse, canWriteCourse, canDeleteCourse,
  canReadBooking, canWriteBooking,
  canReadTemplate, canWriteTemplate,
  canReadFeedback, canWriteFeedback,
};
