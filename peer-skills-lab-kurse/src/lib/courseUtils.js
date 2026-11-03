/**
 * Shared course utility functions
 * Used across multiple pages to ensure consistency in date/time logic
 */

import { format, isValid } from "date-fns";
import { de } from "date-fns/locale";

/** Stornofrist in Stunden — die Zahl steht auch im Hinweistext in MyBookings. */
export const CANCELLATION_WINDOW_HOURS = 72;

/** Ab wie vielen Anmeldungen ein Kurs als "findet statt" gilt. */
export const MIN_PARTICIPANTS_THRESHOLD = 3;

/**
 * Parses a course date string ("YYYY-MM-DD") as local midnight.
 * `new Date("2026-08-10")` is parsed as UTC and can shift a day in negative
 * offsets — the explicit time component keeps every call site on the same day.
 */
export function parseCourseDate(date) {
  if (!date) return null;
  const raw = String(date);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
  return isValid(d) ? d : null;
}

/**
 * Formats a course date for display. Returns "—" for missing or unparseable
 * dates — several dialogs previously crashed with RangeError on undated courses.
 */
export function formatCourseDate(date, pattern = "dd.MM.yyyy") {
  const d = parseCourseDate(date);
  return d ? format(d, pattern, { locale: de }) : "—";
}

/**
 * Exact start of a course, date and time combined. The server derives the
 * cancellation deadline the same way, so both sides agree on the cutoff.
 */
export function getCourseStartDateTime(course) {
  const d = parseCourseDate(course?.date);
  if (!d) return null;

  const timeStr = course.time ? course.time.split(" - ")[0]?.trim() : null;
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  if (Number.isInteger(h) && Number.isInteger(m)) d.setHours(h, m, 0, 0);
  return d;
}

/**
 * May the booking still be cancelled by the student?
 *
 * Allowed up to CANCELLATION_WINDOW_HOURS *before* the course starts — mirrors
 * the server check in routes/bookings.js. (This used to be inverted: it only
 * returned true inside the final 72 hours, so the cancel button was disabled
 * exactly when cancelling was permitted.)
 */
export function isCancellationWindowOpen(course) {
  const start = getCourseStartDateTime(course);
  if (!start) return false;

  const hoursUntilStart = (start - new Date()) / (1000 * 60 * 60);
  return hoursUntilStart >= CANCELLATION_WINDOW_HOURS;
}

/**
 * Is the course close enough that students can no longer cancel themselves?
 *
 * True while the course has not started yet and less than
 * CANCELLATION_WINDOW_HOURS remain. Counterpart of isCancellationWindowOpen
 * (exactly 72 h before the start still counts as open there).
 */
export function isShortNoticeWindow(course) {
  const start = getCourseStartDateTime(course);
  if (!start) return false;

  const hoursUntilStart = (start - new Date()) / (1000 * 60 * 60);
  return hoursUntilStart > 0 && hoursUntilStart < CANCELLATION_WINDOW_HOURS;
}

/**
 * End of a course: the part after " - " in `time` ("10:00 - 12:00"), otherwise
 * the end of the course day.
 */
export function getCourseEndDateTime(course) {
  const d = parseCourseDate(course?.date);
  if (!d) return null;

  const endStr = course.time?.split(" - ")[1]?.trim();
  const [h, m] = (endStr || "").split(":").map(Number);
  if (Number.isInteger(h) && Number.isInteger(m)) d.setHours(h, m, 0, 0);
  else d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Has the course already started? Booking is no longer possible from then on
 * (the server checks the same).
 */
export function hasCourseStarted(course) {
  const start = getCourseStartDateTime(course);
  return !!start && start <= new Date();
}

/**
 * Is the course over? The one rule for "vergangen" everywhere: course overview,
 * Meine Buchungen, Meine Kurse, Meine Statistik. Courses without a date count as
 * upcoming. (Before, each page had its own rule: a course from today already
 * showed up as past at midnight in Meine Buchungen.)
 */
export function isCoursePast(course) {
  const end = getCourseEndDateTime(course);
  return !!end && end <= new Date();
}

/** Can the course still be booked? Same rule as the server. */
export function isCourseBookable(course) {
  return course?.status === "active" && !hasCourseStarted(course);
}
