import React, { useState, useEffect, useMemo } from 'react';
import { peerskillslab } from '@/api/peerskillslabClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'framer-motion';

function getCourseStartDate(course) {
  if (!course?.date) return null;
  try {
    let dateStr = course.date;
    if (typeof dateStr !== 'string') {
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split('T')[0];
      } else {
        return null;
      }
    }
    const timeStr = course.time && course.time.length >= 5 ? course.time.substring(0, 5) : '00:00';
    const date = new Date(`${dateStr}T${timeStr}:00`);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export default function MyStats() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    peerskillslab.auth.me().then(setUser).catch(() => {
      peerskillslab.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myStats', user?.email],
    queryFn: () => peerskillslab.entities.Booking.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['myStatsCourses', user?.email],
    queryFn: () => peerskillslab.entities.Course.list('-date'),
    enabled: !!user?.email,
  });

  const courseMap = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])),
    [courses]
  );

  const attendedCourses = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      if (!b.attended || b.status !== 'confirmed') return false;
      const course = courseMap[b.course_id];
      if (!course) return false;
      const courseStart = getCourseStartDate(course);
      return courseStart && courseStart < now;
    });
  }, [bookings, courseMap]);

  const statsByCategory = useMemo(() => {
    const stats = {};
    attendedCourses.forEach((b) => {
      const course = courseMap[b.course_id];
      const category = course?.category || 'Sonstiges';
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }, [attendedCourses, courseMap]);

  if (!user) return null;

  return (
    <div className="psl-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground mb-2">Meine Statistik</h1>
        <p className="text-muted-foreground mb-8">Überblick über deine besuchten Kurse</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : attendedCourses.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Noch keine besuchten Kurse</h3>
          <p className="text-muted-foreground">Kurse werden angezeigt, sobald dein Tutor deine Anwesenheit bestätigt hat.</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Gesamtzahl */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{attendedCourses.length}</div>
                  <p className="text-muted-foreground">Besuchte Kurse</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Nach Kategorie */}
          {Object.keys(statsByCategory).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Nach Kategorie
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(statsByCategory).map(([category, count]) => (
                  <Card key={category}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{category}</span>
                        <span className="text-2xl font-bold text-primary">{count}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* Auflistung aller Kurse */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Besuchte Kurse
            </h2>
            <div className="space-y-3">
              {attendedCourses.map((booking) => {
                const course = courseMap[booking.course_id];
                const courseStart = getCourseStartDate(course);
                return (
                  <Card key={booking.id} className="border-border/60 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">{booking.course_title}</div>
                        <div className="text-sm text-muted-foreground">
                          {course?.category && <span>{course.category} • </span>}
                          {courseStart && format(courseStart, 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      </div>
                      <div className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                        Besucht
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
