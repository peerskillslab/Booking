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
  statsBookings: () => ["statsBookings"],

  // Stats & Snapshots
  myStats: (email) => ["myStats", email],
  statsSnapshots: () => ["statsSnapshots"],

  // Users
  adminUsers: () => ["adminUsers"],
  usersForInstructor: () => ["usersForInstructor"],

  // Templates
  courseTemplates: () => ["courseTemplates"],
};
