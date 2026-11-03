import React from "react";
import { AlertTriangle } from "lucide-react";
import { CANCELLATION_WINDOW_HOURS, isShortNoticeWindow } from "@/lib/courseUtils";

/**
 * Hinweisbalken für Kurse, die in weniger als 72 Stunden beginnen: Selbst
 * abmelden geht dann nicht mehr, die Absage läuft direkt über die Tutor:in.
 *
 * Die Adresse der Tutor:in bekommen nur eingeloggte Nutzer:innen mitgeliefert
 * (server/routes/courses.js, stripContactData). Ohne Adresse erscheint der Text
 * ohne Link, es sei denn, `fallbackEmail` ist gesetzt.
 */
export default function ShortNoticeBanner({ course, fallbackEmail, className = "" }) {
  if (!course || !isShortNoticeWindow(course)) return null;

  const tutorName = course.instructor || "der Tutor:in";
  const tutorEmail = course.instructor_email || course.created_by;
  const email = tutorEmail || fallbackEmail;
  const subject = `Abmeldung: ${course.title || course.course_title || "Kurs"}`;
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-800 ${className}`}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="leading-snug">
        Dieser Kurs findet in weniger als {CANCELLATION_WINDOW_HOURS} Stunden statt.
        Abmeldungen sind nur noch direkt bei {tutorName} möglich.
        {mailto && (
          <>
            {" "}
            <a href={mailto} className="font-medium underline underline-offset-2 hover:text-amber-950">
              Per Mail abmelden
            </a>
          </>
        )}
      </p>
    </div>
  );
}
