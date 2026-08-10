/**
 * Centralized React Query key factory
 * Prevents query key duplication and ensures consistent invalidation across the app
 */

export const queryKeys = {
  // Courses
  courses: () => ["courses"],
  course: (id) => ["course", id],
  adminCourses: () => ["adminCourses"],
  tutorCourses: (email) => ["tutorCourses", email],
  statsCourses: () => ["statsCourses"],

  // Bookings
  myBookings: (email) => ["myBookings", email],
  myBookingsCourses: (email) => ["myBookingsCourses", email],
  courseBookings: (courseId) => ["courseBookings", courseId],
  courseParticipants: (courseId) => ["courseParticipants", courseId],
  userBookings: (courseId, email) => ["userBookings", courseId, email],
  statsBookings: () => ["statsBookings"],

  // Stats & Snapshots
  myStats: (email) => ["myStats", email],
  myStatsCourses: (email) => ["myStatsCourses", email],
  statsSnapshots: () => ["statsSnapshots"],

  // Auth
  currentUser: () => ["user"],

  // Users
  adminUsers: () => ["adminUsers"],
  usersForInstructor: () => ["usersForInstructor"],

  // Templates
  courseTemplates: () => ["courseTemplates"],
};
