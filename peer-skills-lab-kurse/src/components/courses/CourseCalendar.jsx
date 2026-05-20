import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const categoryColors = {
  "CST Abdomen":        { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   },
  "CST HKL":            { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200"    },
  "CST Gynäkologie":    { bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200"   },
  "CST Lunge":          { bg: "bg-sky-100",    text: "text-sky-700",    border: "border-sky-200"    },
  "CST Neurologie":     { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  "CST Bewegungsapparat":{ bg: "bg-amber-100", text: "text-amber-700",  border: "border-amber-200"  },
  "POCUS":              { bg: "bg-teal-100",   text: "text-teal-700",   border: "border-teal-200"   },
  "Venenpunktion":      { bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200"  },
  "YSSA":               { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
};

const fallbackColor = { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" };

function CourseChip({ course }) {
  const color = categoryColors[course.category] || fallbackColor;
  return (
    <Link
      to={createPageUrl("CourseDetail") + `?id=${course.id}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "block w-full text-left rounded-md px-1.5 py-1 border text-xs leading-tight",
        "hover:brightness-95 transition-all truncate",
        color.bg, color.text, color.border
      )}
    >
      <div className="font-semibold truncate">{course.title}</div>
      {course.time && (
        <div className="flex items-center gap-0.5 mt-0.5 opacity-70">
          <Clock className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{course.time.split(" - ")[0]}</span>
        </div>
      )}
    </Link>
  );
}

export default function CourseCalendar({ courses, selectedDate, onSelectDate }) {
  const firstCourseDate = courses.length > 0
    ? new Date(courses.slice().sort((a, b) => a.date?.localeCompare(b.date))[0].date)
    : new Date();

  const [currentMonth, setCurrentMonth] = useState(firstCourseDate);

  const coursesByDate = {};
  courses.forEach((c) => {
    if (c.date) {
      const key = c.date.slice(0, 10);
      if (!coursesByDate[key]) coursesByDate[key] = [];
      coursesByDate[key].push(c);
    }
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  const handleDayClick = (d) => {
    const key = format(d, "yyyy-MM-dd");
    if (selectedDate === key) {
      onSelectDate(null);
    } else {
      onSelectDate(key);
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h3 className="text-base font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy", { locale: de })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/60">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="text-center text-xs font-semibold text-muted-foreground py-2 border-r border-border/40 last:border-r-0"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="divide-y divide-border/40">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-border/40 min-h-[100px]">
            {week.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const dayCourses = coursesByDate[key] || [];
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const todayDay = isToday(d);
              const isSelected = selectedDate === key;

              return (
                <div
                  key={key}
                  onClick={() => handleDayClick(d)}
                  className={cn(
                    "p-1.5 flex flex-col gap-1 cursor-pointer transition-colors min-h-[100px]",
                    !isCurrentMonth && "bg-muted/30",
                    isSelected && "bg-primary/5",
                    isCurrentMonth && !isSelected && "hover:bg-muted/40",
                  )}
                >
                  {/* Day number */}
                  <span
                    className={cn(
                      "self-start text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-0.5",
                      todayDay && "bg-primary text-primary-foreground",
                      !todayDay && isCurrentMonth && "text-foreground",
                      !isCurrentMonth && "text-muted-foreground/50",
                    )}
                  >
                    {format(d, "d")}
                  </span>

                  {/* Course chips */}
                  <div className="flex flex-col gap-0.5 w-full">
                    {dayCourses.slice(0, 3).map((course, i) => (
                      <CourseChip key={i} course={course} />
                    ))}
                    {dayCourses.length > 3 && (
                      <span className="text-xs text-muted-foreground px-1">
                        +{dayCourses.length - 3} weitere
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border/60 flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(categoryColors)
          .filter(([cat]) => courses.some((c) => c.category === cat))
          .map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className={cn("w-2 h-2 rounded-sm", color.bg, "border", color.border)} />
              {cat}
            </span>
          ))}
      </div>
    </div>
  );
}