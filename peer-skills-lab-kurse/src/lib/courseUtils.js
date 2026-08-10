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
 * Check if a course is in the cancellation window (72 hours before start)
 */
export function isCancellationWindowOpen(course) {
  const start = getCourseStartDate(course);
  if (!start?.date) return false;

  const now = new Date();
  const hoursDiff = (start.date - now) / (1000 * 60 * 60);
  return hoursDiff <= CANCELLATION_WINDOW_HOURS && hoursDiff > 0;
}

/**
 * Check if a course has already started (is in the past)
 */
export function isCoursePast(course) {
  const start = getCourseStartDate(course);
  if (!start?.date) return false;
  return start.date <= new Date();
}
