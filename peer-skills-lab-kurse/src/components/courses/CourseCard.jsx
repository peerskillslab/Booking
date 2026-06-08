import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const CAT_COLORS = {
  "CST Abdomen":        "#C0563B",
  "CST HKL":            "#C0394B",
  "CST Gynäkologie":    "#B5519E",
  "CST Lunge":          "#3E86C7",
  "CST Neurologie":     "#7A5CC4",
  "CST Bewegungsapparat": "#2F9E6E",
  "POCUS":              "#C9962B",
  "Venenpunktion":      "#2D8C9E",
  "YSSA":               "#8A8D2F",
};

function bannerBg(category) {
  const c = CAT_COLORS[category] || "#466E0E";
  return `linear-gradient(140deg, ${c}, color-mix(in srgb, ${c} 62%, #000 18%))`;
}

export default function CourseCard({ course }) {
  const spotsLeft = (course.max_participants || 0) - (course.current_participants || 0);
  const isFull = spotsLeft <= 0;
  const catColor = CAT_COLORS[course.category] || "#466E0E";

  const dateStr = course.date
    ? (() => { try { return format(new Date(course.date), "dd. MMM yyyy", { locale: de }); } catch { return course.date; } })()
    : null;

  return (
    <Link to={createPageUrl("CourseDetail") + `?id=${course.id}`} style={{ textDecoration: "none" }}>
      <div className="psl-course-card">
        {/* Banner */}
        <div className="psl-cc-banner" style={{ background: bannerBg(course.category) }}>
          {course.image_url ? (
            <img src={course.image_url} alt={course.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 36, height: 36, opacity: 0.8 }}>
              <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H13a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 0 4 20.5z" />
              <path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H14" />
            </svg>
          )}
          <span className="psl-cc-cat">{course.category}</span>
          <span className="psl-cc-status" style={{ color: isFull ? "#b1442f" : "#1d6b2f" }}>
            {isFull ? "Voll" : "Frei"}
          </span>
        </div>

        {/* Body */}
        <div className="psl-cc-body">
          <div>
            <div className="psl-cc-title">{course.title}</div>
            {course.short_description && (
              <div className="psl-cc-desc">{course.short_description}</div>
            )}
          </div>
          <div className="psl-cc-meta">
            {dateStr && (
              <div className="psl-cc-meta-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" /><path d="M3.5 9h17M8 2.5v4M16 2.5v4" />
                </svg>
                {dateStr}
              </div>
            )}
            {course.time && (
              <div className="psl-cc-meta-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" />
                </svg>
                {course.time}
              </div>
            )}
            {course.instructor && (
              <div className="psl-cc-meta-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
                {course.instructor}
              </div>
            )}
          </div>
          <div className="psl-cc-foot">
            <span className="psl-cc-seats">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="9" r="2.6" /><circle cx="16" cy="9" r="2.6" />
                <path d="M3 19a5 5 0 0 1 10 0M13 19a5 5 0 0 1 8-4" />
              </svg>
              {isFull ? "Warteliste" : `${spotsLeft} Plätze frei`}
            </span>
            {course.kurs_nr && (
              <span className="psl-badge mono">K-{String(course.kurs_nr).padStart(3, "0")}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
