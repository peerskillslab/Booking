/**
 * Query Invalidation Strategy
 *
 * Defines which queries should be invalidated for each action
 * to prevent unnecessary refetches and stale UI updates.
 */

import { queryKeys } from './queryKeys';

/**
 * When creating a booking, only the course participants and user's bookings change
 * Stats are NOT affected (only on attendance marking)
 */
export function invalidateOnBookingCreate(queryClient, courseId, userEmail) {
  queryClient.invalidateQueries({ queryKey: queryKeys.courseParticipants(courseId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.myBookings(userEmail) });
  queryClient.invalidateQueries({ queryKey: queryKeys.myBookingsCourses(userEmail) });
}

/**
 * When cancelling a booking, only course participants and user's bookings change
 * Stats are NOT affected
 */
export function invalidateOnBookingCancel(queryClient, courseId, userEmail) {
  queryClient.invalidateQueries({ queryKey: queryKeys.courseParticipants(courseId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.myBookings(userEmail) });
  queryClient.invalidateQueries({ queryKey: queryKeys.myBookingsCourses(userEmail) });
}

/**
 * When marking attendance, only stats are affected
 * NOT course-level data
 */
export function invalidateOnAttendanceChange(queryClient, userEmail) {
  queryClient.invalidateQueries({ queryKey: queryKeys.myStats(userEmail) });
  queryClient.invalidateQueries({ queryKey: queryKeys.statsBookings() });
}

/**
 * When creating a course (from admin or template)
 * - Admin courses list changes
 * - Public courses list changes (if status='active')
 * - Stats should recalculate (new course available)
 * - Do NOT invalidate user bookings
 */
export function invalidateOnCourseCreate(queryClient, status = 'active') {
  queryClient.invalidateQueries({ queryKey: queryKeys.adminCourses() });
  if (status === 'active') {
    queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
  }
}

/**
 * When updating a course
 * - Admin courses list changes
 * - Public courses list changes (if active)
 * - Only that specific course's participants (if max_participants changed)
 * - Do NOT invalidate bookings or stats (unless critical field changed)
 */
export function invalidateOnCourseUpdate(queryClient, courseId, statusChanged = false) {
  queryClient.invalidateQueries({ queryKey: queryKeys.adminCourses() });
  queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
  queryClient.invalidateQueries({ queryKey: queryKeys.course(courseId) });

  // Only if status changed (e.g. published → archived)
  if (statusChanged) {
    queryClient.invalidateQueries({ queryKey: queryKeys.statsCourses() });
  }
}

/**
 * When deleting a course
 * - Admin courses list changes
 * - Public courses list changes
 * - Course-specific data cleared
 * - Stats need recalculation
 */
export function invalidateOnCourseDelete(queryClient, courseId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.adminCourses() });
  queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
  queryClient.invalidateQueries({ queryKey: queryKeys.course(courseId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.statsCourses() });
}

/**
 * When publishing a course from template
 * Same as creating a new course
 */
export function invalidateOnCoursePublish(queryClient) {
  invalidateOnCourseCreate(queryClient, 'active');
}

/**
 * When booking a course, the "have I already booked this?" query on the
 * course detail page has to refresh too — otherwise the booking button stays
 * enabled after a successful booking.
 */
export function invalidateOnBookingChange(queryClient, courseId, userEmail) {
  invalidateOnBookingCreate(queryClient, courseId, userEmail);
  queryClient.invalidateQueries({ queryKey: queryKeys.userBookings(courseId, userEmail) });
  queryClient.invalidateQueries({ queryKey: queryKeys.course(courseId) });
}
