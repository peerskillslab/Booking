import React, { useState, useEffect, useMemo } from 'react';
import { peerskillslab } from '@/api/peerskillslabClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { getCourseStartDate, isCoursePast } from '@/lib/courseUtils';

function CourseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="14" height="2" rx="1" fill="currentColor" />
      <rect x="2" y="8" width="10" height="2" rx="1" fill="currentColor" />
      <rect x="2" y="12" width="7" height="2" rx="1" fill="currentColor" />
    </svg>
  );
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
      return isCoursePast(course);
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

  const lastCourse = useMemo(() => {
    if (attendedCourses.length === 0) return null;
    const sorted = [...attendedCourses].sort((a, b) => {
      const dateA = getCourseStartDate(courseMap[a.course_id])?.date;
      const dateB = getCourseStartDate(courseMap[b.course_id])?.date;
      return (dateB || new Date(0)) - (dateA || new Date(0));
    });
    const booking = sorted[0];
    const course = courseMap[booking.course_id];
    const courseStart = getCourseStartDate(course);
    return {
      title: booking.course_title,
      category: course?.category || 'Sonstiges',
      date: courseStart?.date ? format(courseStart.date, "dd.MM.yyyy '·' HH:mm 'Uhr'", { locale: de }) : '—',
    };
  }, [attendedCourses, courseMap]);

  const topCategory = useMemo(() => {
    const entries = Object.entries(statsByCategory);
    if (entries.length === 0) return null;
    return entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max));
  }, [statsByCategory]);

  if (!user) return null;

  const totalCourses = attendedCourses.length;

  return (
    <div className="psl-page" style={{ maxWidth: 900 }}>
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>Meine Statistik</h1>
        <p style={{ fontSize: 14, marginBottom: 36 }}>Überblick über deine besuchten Kurse</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : totalCourses === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Noch keine besuchten Kurse</h3>
          <p className="text-muted-foreground">Kurse werden angezeigt, sobald dein Tutor deine Anwesenheit bestätigt hat.</p>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Stat Hero Row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="psl-stats-hero-row"
          >
            {/* Big Number Card */}
            <div className="psl-stats-hero-card">
              <p className="psl-stats-hero-label">Besuchte Kurse</p>
              <div>
                <div className="psl-stats-hero-number">{totalCourses}</div>
                <p className="psl-stats-hero-subtext">insgesamt</p>
              </div>
            </div>

            {/* Info Card */}
            <div className="psl-stats-info-card">
              <div className="psl-stats-info-row bordered">
                <div>
                  <p className="psl-stats-info-label">Letzter Kurs</p>
                  <p className="psl-stats-info-title">{lastCourse?.title || '—'}</p>
                  <p className="psl-stats-info-meta">{lastCourse?.date || '—'}</p>
                </div>
                <div className="psl-stats-badge">Besucht</div>
              </div>
              <div className="psl-stats-info-row">
                <div>
                  <p className="psl-stats-info-label">Aktivste Kategorie</p>
                  <p className="psl-stats-info-title">{topCategory?.[0] || '—'}</p>
                </div>
                <div className="psl-stats-info-number">{topCategory?.[1] || 0}</div>
              </div>
            </div>
          </motion.div>

          {/* Nach Kategorie */}
          {Object.keys(statsByCategory).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16 }}
            >
              <div className="psl-stats-section-header">
                <div className="psl-stats-dot" />
                <h2 className="psl-stats-section-title">Nach Kategorie</h2>
              </div>
              <div className="psl-stats-card-list">
                {Object.entries(statsByCategory).map(([category, count], i) => (
                  <div
                    key={category}
                    className="psl-stats-category-row"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="psl-stats-bar-section">
                      <div className="psl-stats-category-header">
                        <span className="psl-stats-category-name">{category}</span>
                        <span className="psl-stats-category-count">{count} Kurs{count !== 1 ? 'e' : ''}</span>
                      </div>
                      <div className="psl-stats-bar-track">
                        <div
                          className="psl-stats-bar-fill"
                          style={{ '--bar-width': `${(count / totalCourses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Besuchte Kurse */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
          >
            <div className="psl-stats-section-header">
              <div className="psl-stats-dot" />
              <h2 className="psl-stats-section-title">Besuchte Kurse</h2>
            </div>
            <div className="psl-stats-card-list">
              {attendedCourses.map((booking) => {
                const course = courseMap[booking.course_id];
                const courseStart = getCourseStartDate(course);
                return (
                  <div key={booking.id} className="psl-stats-course-row">
                    <div className="psl-stats-course-icon">
                      <CourseIcon />
                    </div>
                    <div className="psl-stats-course-content">
                      <p className="psl-stats-course-title">{booking.course_title}</p>
                      <p className="psl-stats-course-meta">
                        {course?.category || 'Sonstiges'}
                        <span className="psl-stats-course-sep">·</span>
                        {courseStart?.date ? format(courseStart.date, 'dd.MM.yyyy · HH:mm', { locale: de }) : '—'}
                      </p>
                    </div>
                    <div className="psl-stats-badge">Besucht</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
