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

export function getCourseStartDate(course) {
  if (!course || !course.date) return null;

  const d = parseCourseDate(course.date);
  if (!d) return null;

  const timeStr = course.time ? course.time.split(" - ")[0]?.trim() : null;
  return { date: d, time: timeStr };
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
 * Check if a course has already started (is in the past)
 */
export function isCoursePast(course) {
  const start = getCourseStartDate(course);
  if (!start?.date) return false;
  return start.date <= new Date();
}
