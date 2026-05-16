import { peerskillslab } from "@/api/peerskillslabClient";

export async function incrementCourseParticipants(courseId) {
  const course = await peerskillslab.entities.Course.filter({ id: courseId });
  if (course.length === 0) throw new Error("Kurs nicht gefunden");

  return peerskillslab.entities.Course.update(courseId, {
    current_participants: (course[0].current_participants || 0) + 1,
  });
}