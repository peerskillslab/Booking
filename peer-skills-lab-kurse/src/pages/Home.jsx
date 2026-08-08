// @ts-nocheck
import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import HeroSection from "@/components/courses/HeroSection";
import CategoryFilter from "@/components/courses/CategoryFilter";
import CourseCard from "@/components/courses/CourseCard";
import CourseCalendar from "@/components/courses/CourseCalendar";
import { Loader2, CalendarDays, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { CATEGORY_COLORS } from "@/lib/categoryStyles";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("grid"); // "grid" | "calendar"
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.refetchQueries({ queryKey: ["courses"] });
  };

  const { pullDistance, isRefreshing, containerRef, handlers } = usePullToRefresh(handleRefresh);

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const allCourses = await peerskillslab.entities.Course.list();
      const today = new Date().toISOString().slice(0, 10);
      return allCourses
        .filter(c => c.status === "active" && (!c.date || c.date >= today))
        .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    },
  });

  const baseFilter = (course) => {
    const matchesCategory =
      selectedCategory === "all" || course.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  };

  // Calendar gets all courses (no date filter — the calendar handles date display itself)
  const calendarCourses = courses.filter(baseFilter);

  // Grid view respects the date filter
  const filteredCourses = calendarCourses.filter((course) =>
    !selectedDate || (course.date && course.date.slice(0, 10) === selectedDate)
  );

  // Listen for course updates via subscriptions
  useEffect(() => {
    const unsubscribe = peerskillslab.entities.Course.subscribe((event) => {
      refetch();
    });
    return unsubscribe;
  }, [refetch]);

  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];

  return (
    <div className="psl-page">
      {/* Search + view toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7, height: 30, padding: "0 10px",
          background: "var(--psl-fill)", boxShadow: "inset 0 0 0 0.5px var(--psl-hairline)",
          borderRadius: "var(--psl-r-ctl)", flex: 1, maxWidth: 280,
          fontFamily: "var(--psl-font)",
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, color: "var(--psl-text-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Kurse suchen"
            style={{ border: "none", background: "none", outline: "none", fontSize: 12.5, color: "var(--psl-text)", width: "100%", fontFamily: "var(--psl-font)" }}
          />
        </div>

        <div style={{
          display: "inline-flex", padding: 2, gap: 2,
          background: "var(--psl-fill)", borderRadius: "var(--psl-r-ctl)",
          boxShadow: "inset 0 0 0 0.5px var(--psl-hairline)",
        }}>
          {[["grid", "Kacheln"], ["calendar", "Kalender"]].map(([v, label]) => (
            <button key={v} onClick={() => { setView(v); if (v === "grid") setSelectedDate(null); }}
              style={{
                height: 24, padding: "0 11px", borderRadius: 5, border: "none", cursor: "pointer",
                fontSize: 12.5, fontWeight: 500, fontFamily: "var(--psl-font)",
                color: view === v ? "var(--psl-text)" : "var(--psl-text-2)",
                background: view === v ? "var(--psl-card-bg)" : "transparent",
                boxShadow: view === v ? "0 0.5px 2px rgba(0,0,0,.16), 0 0 0 0.5px var(--psl-hairline)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
        <button className={`psl-pill${selectedCategory === "all" ? " on" : ""}`}
          onClick={() => setSelectedCategory("all")}>Alle</button>
        {categories.map(cat => (
          <button key={cat} className={`psl-pill${selectedCategory === cat ? " on" : ""}`}
            onClick={() => setSelectedCategory(cat)}>
            <span className="psl-cat-dot" style={{ background: CATEGORY_COLORS[cat] || "#888" }} />
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
      ) : view === "calendar" ? (
        <CourseCalendar courses={calendarCourses} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      ) : filteredCourses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--psl-text-3)" }}>
          <p style={{ fontSize: 13 }}>Keine Kurse gefunden. Versuche es mit einer anderen Suche oder Kategorie.</p>
        </div>
      ) : (
        <div className="psl-course-grid">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}