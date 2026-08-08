/**
 * Shared course utility functions
 * Used across multiple pages to ensure consistency in date/time logic
 */

export function getCourseStartDate(course) {
  if (!course || !course.date) return null;

  try {
    // Handle both Date objects and ISO strings
    const d = new Date(course.date);
    if (isNaN(d.getTime())) return null;

    // Extract time if available
    const timeStr = course.time
      ? course.time.split(" - ")[0]?.trim()
      : null;

    return {
      date: d,
      time: timeStr,
      toLocaleString: () => {
        const dateStr = d.toLocaleDateString("de-CH");
        return timeStr ? `${dateStr}, ${timeStr}` : dateStr;
      },
    };
  } catch {
    return null;
  }
}

/**
 * Check if a course is in the cancellation window (72 hours before start)
 */
export function isCancellationWindowOpen(course) {
  const start = getCourseStartDate(course);
  if (!start?.date) return false;

  const now = new Date();
  const hoursDiff = (start.date - now) / (1000 * 60 * 60);
  return hoursDiff <= 72 && hoursDiff > 0;
}

/**
 * Check if a course has already started (is in the past)
 */
export function isCoursePast(course) {
  const start = getCourseStartDate(course);
  if (!start?.date) return false;
  return start.date <= new Date();
}
