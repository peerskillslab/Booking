// @ts-nocheck
import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CourseCard from "@/components/courses/CourseCard";
import CourseCalendar from "@/components/courses/CourseCalendar";
import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { getCategoryOklch } from "@/lib/categoryStyles";

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
        <div className="psl-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Kurse suchen"
          />
        </div>

        <div className="psl-view-toggle">
          {[["grid", "Kacheln"], ["calendar", "Kalender"]].map(([v, label]) => (
            <button key={v} onClick={() => { setView(v); if (v === "grid") setSelectedDate(null); }}
              className={view === v ? "active" : ""}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
        <button className={`psl-pill${selectedCategory === "all" ? " on" : ""}`}
          onClick={() => setSelectedCategory("all")}>Alle</button>
        {categories.map(cat => {
          const colors = getCategoryOklch(cat);
          return (
            <button key={cat} className={`psl-pill${selectedCategory === cat ? " on" : ""}`}
              onClick={() => setSelectedCategory(cat)}>
              <span className="psl-cat-dot" style={{ background: colors.solid }} />
              {cat}
            </button>
          );
        })}
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