import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getCategoryOklch } from "@/lib/categoryStyles";

const LEVEL_LABELS = {
  "Alle Studienjahre":   "ALLE STUDIENJAHRE",
  "ab 1. Studienjahr":   "AB 1. STUDI-JAHR",
  "ab 2. Studienjahr":   "AB 2. STUDI-JAHR",
  "ab 3. Studienjahr":   "AB 3. STUDI-JAHR",
  "ab 4. Studienjahr":   "AB 4. STUDI-JAHR",
  "ab 5. Studienjahr":   "AB 5. STUDI-JAHR",
  "ab 6. Studienjahr":   "AB 6. STUDI-JAHR",
};

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CourseCard({ course }) {
  const current = course.current_participants || 0;
  const max = course.max_participants || 0;
  const isFull = max > 0 && current >= max;
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const colors = getCategoryOklch(course.category);

  let dayAbbr = null, dayNum = null, monthAbbr = null;
  if (course.date) {
    try {
      const d = new Date(course.date);
      dayAbbr  = format(d, "EEE", { locale: de }).toUpperCase().replace(".", "");
      dayNum   = format(d, "d");
      monthAbbr = format(d, "MMM", { locale: de }).toUpperCase().replace(".", "");
    } catch {}
  }

  const levelLabel = course.level ? (LEVEL_LABELS[course.level] || course.level.toUpperCase()) : null;

  return (
    <Link to={createPageUrl("CourseDetail") + `?id=${course.id}`} style={{ textDecoration: "none" }}>
      <div className="psl-course-card">

        {/* Header: date box + badges */}
        <div className="psl-cc-header">
          {dayAbbr && (
            <div className="psl-cc-datebox">
              <span className="psl-cc-day-abbr">{dayAbbr}</span>
              <span className="psl-cc-day-num">{dayNum}.</span>
              <span className="psl-cc-month">{monthAbbr}</span>
            </div>
          )}
          <div className="psl-cc-badges">
            <span className="psl-cc-cat-badge" style={{ color: colors.text, background: colors.bg }}>
              <span className="psl-cc-cat-dot" style={{ background: colors.solid }} />
              {course.category}
            </span>
            {levelLabel && (
              <span className="psl-cc-level-badge">{levelLabel}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="psl-cc-body">
          <div className="psl-cc-title">{course.title}</div>
          {course.short_description && (
            <div className="psl-cc-desc">{course.short_description}</div>
          )}
          <div className="psl-cc-meta">
            {course.time && (
              <div className="psl-cc-meta-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" />
                </svg>
                {course.time}
              </div>
            )}
            {course.location && (
              <div className="psl-cc-meta-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {course.location}
              </div>
            )}
          </div>
        </div>

        {/* Footer: instructor + seats */}
        <div className="psl-cc-foot">
          <div className="psl-cc-instructor">
            <div className="psl-cc-avatar" style={{ background: colors.solid }}>
              {initials(course.instructor)}
            </div>
            <div className="psl-cc-instructor-info">
              <span className="psl-cc-instructor-name">{course.instructor || "—"}</span>
              <span className="psl-cc-instructor-role">Kursleitung</span>
            </div>
          </div>
          <div className="psl-cc-seats-wrap">
            <div className="psl-cc-seats-count" style={{ color: isFull ? "var(--psl-danger)" : "var(--psl-text-2)" }}>
              {current}/{max}
              {isFull && <span className="psl-cc-full-badge">voll</span>}
            </div>
            <div className="psl-cc-progress-track">
              <div className="psl-cc-progress-bar"
                style={{
                  width: `${pct}%`,
                  background: isFull ? "var(--psl-danger)" : colors.solid,
                }} />
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}
