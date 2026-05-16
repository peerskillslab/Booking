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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background"
      style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" }}
      {...handlers}
    >
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <HeroSection searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        {/* Toolbar: category filter + view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 self-start sm:self-auto shrink-0">
            <button
              onClick={() => {
                setView("grid");
                setSelectedDate(null);
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                view === "grid"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Kacheln
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                view === "calendar"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              Kalender
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "calendar" ? (
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <CourseCalendar
                  courses={calendarCourses}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-5xl mb-4">🔍</p>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Keine Kurse gefunden
                    </h3>
                    <p className="text-muted-foreground">
                      Versuche es mit einer anderen Suche oder Kategorie.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course, i) => (
                      <CourseCard key={course.id} course={course} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}