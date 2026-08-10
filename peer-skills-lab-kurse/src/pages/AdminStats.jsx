// @ts-nocheck
import React, { useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Archive, Trash2, Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import { getInitials, downloadCsv } from "@/lib/utils";
import { MIN_PARTICIPANTS_THRESHOLD, parseCourseDate } from "@/lib/courseUtils";


const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdminStats() {
  const autoSnapshotRef = React.useRef(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();
  const currentUser = user?.role === "admin" ? user : null;

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      peerskillslab.auth.redirectToLogin(window.location.href);
    } else if (user.role !== "admin") {
      window.location.href = "/";
    }
  }, [user, isLoadingAuth]);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: queryKeys.statsCourses(),
    queryFn: () => peerskillslab.entities.Course.list("-date"),
    enabled: !!currentUser,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: queryKeys.statsBookings(),
    queryFn: () => peerskillslab.entities.Booking.filter({ status: "confirmed" }),
    enabled: !!currentUser,
  });

  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: queryKeys.statsSnapshots(),
    queryFn: () => peerskillslab.entities.MonthlyStatSnapshot.list("-created_date"),
    enabled: !!currentUser,
  });

  // Auto-snapshot: create last month's snapshot if missing
  useEffect(() => {
    if (!currentUser || coursesLoading || bookingsLoading || snapshotsLoading) return;
    if (autoSnapshotRef.current) return;
    autoSnapshotRef.current = true;

    const lastMonth = subMonths(new Date(), 1);
    const lastMonthLabel = format(lastMonth, "MMMM yyyy", { locale: de });
    if (snapshots.some((s) => s.month_label === lastMonthLabel)) return;

    const lastMonthCourses = courses.filter((c) => {
      if (!c.date) return false;
      const d = parseCourseDate(c.date);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });
    if (lastMonthCourses.length === 0) return;

    const lastMonthBookings = bookings.filter((b) => {
      if (!b.created_date) return false;
      const d = new Date(b.created_date);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });

    const tutorMap = {};
    lastMonthCourses.forEach((c) => {
      const name = c.instructor || "Unbekannt";
      if (!tutorMap[name]) tutorMap[name] = { courses: 0, participants: 0 };
      tutorMap[name].courses += 1;
      tutorMap[name].participants += c.current_participants || 0;
    });
    const lastMonthTutorData = Object.entries(tutorMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.courses - a.courses);

    const snapshotData = {
      month_label: lastMonthLabel,
      total_courses: lastMonthCourses.length,
      total_participants: lastMonthCourses.reduce((sum, c) => sum + (c.current_participants || 0), 0),
      total_bookings: lastMonthBookings.length,
      tutor_data: JSON.stringify(lastMonthTutorData),
      course_data: JSON.stringify(lastMonthCourses.map((c) => ({
        title: c.title,
        instructor: c.instructor,
        date: c.date,
        time: c.time,
        current_participants: c.current_participants || 0,
        max_participants: c.max_participants || 0,
      }))),
      reset_date: format(lastMonth, "yyyy-MM-dd"),
    };

    peerskillslab.entities.MonthlyStatSnapshot.create(snapshotData)
      .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.statsSnapshots() }))
      .catch(() => {
        // Beim nächsten Laden erneut versuchen statt still zu scheitern.
        autoSnapshotRef.current = false;
        toast({
          title: "Monats-Snapshot konnte nicht erstellt werden",
          description: "Er wird beim nächsten Öffnen erneut versucht.",
          variant: "destructive",
        });
      });
  }, [currentUser, coursesLoading, bookingsLoading, snapshotsLoading, courses, bookings, snapshots, queryClient, toast]);

  if (!currentUser) return null;

  const isLoading = coursesLoading || bookingsLoading;

  // Aktuelle Monatsstatistik (nur Kurse dieses Monats)
  const now = new Date();
  const currentMonthCourses = courses.filter((c) => {
    if (!c.date) return false;
    const d = parseCourseDate(c.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const currentMonthBookings = bookings.filter((b) => {
    if (!b.created_date) return false;
    const d = new Date(b.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const monthParticipants = currentMonthCourses.reduce((sum, c) => sum + (c.current_participants || 0), 0);

  // Gesamtstatistik
  const totalCourses = courses.length;
  const totalParticipants = courses.reduce((sum, c) => sum + (c.current_participants || 0), 0);
  const totalBookings = bookings.length;

  // Vergangene Kurse – stattgefunden vs. nicht stattgefunden (< 3 Teilnehmende)
  const pastCourses = courses.filter((c) => parseCourseDate(c.date) && parseCourseDate(c.date) < now);
  const coursesHeld = pastCourses.filter((c) => (c.current_participants || 0) >= MIN_PARTICIPANTS_THRESHOLD);
  const coursesCancelled = pastCourses.filter((c) => (c.current_participants || 0) < MIN_PARTICIPANTS_THRESHOLD);

  // YSSA-Statistik
  const yssaCourses = courses.filter(c => c.category === "YSSA");
  const yssaParticipants = yssaCourses.reduce((sum, c) => sum + (c.current_participants || 0), 0);
  const yssaBookings = bookings.filter(b =>
    yssaCourses.some(c => c.id === b.course_id)
  ).length;

  // Tutor-Daten (aktueller Monat)
  const tutorMap = {};
  currentMonthCourses.forEach((c) => {
    const name = c.instructor || "Unbekannt";
    if (!tutorMap[name]) tutorMap[name] = { courses: 0, participants: 0 };
    tutorMap[name].courses += 1;
    tutorMap[name].participants += c.current_participants || 0;
  });
  const tutorData = Object.entries(tutorMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.courses - a.courses);

  // Durchgeführte Kurse nach Tutor:in (alle vergangenen Kurse, zeitunabhängig)
  const pastTutorMap = {};
  pastCourses.forEach((c) => {
    const name = c.instructor || "Unbekannt";
    if (!pastTutorMap[name]) pastTutorMap[name] = { held: 0, cancelled: 0 };
    if ((c.current_participants || 0) >= MIN_PARTICIPANTS_THRESHOLD) pastTutorMap[name].held += 1;
    else pastTutorMap[name].cancelled += 1;
  });
  const pastTutorData = Object.entries(pastTutorMap)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  // CSV Export (aktueller Monat) – einzelne Kurse
  const handleExportCSV = () => {
    const monthLabel = format(now, "MMMM yyyy", { locale: de });
    const rows = [
      ["Monat", "Kursname", "Tutor:in", "Datum", "Zeit", "Teilnehmende", "Max. Plätze", "Status"],
      ...currentMonthCourses.map((c) => {
        const isPast = parseCourseDate(c.date) && parseCourseDate(c.date) < now;
        const status = !isPast
          ? "Ausstehend"
          : (c.current_participants || 0) >= MIN_PARTICIPANTS_THRESHOLD
            ? "Stattgefunden"
            : "Nicht stattgefunden";
        return [
          monthLabel,
          c.title || "—",
          c.instructor || "—",
          c.date || "—",
          c.time || "—",
          c.current_participants || 0,
          c.max_participants || 0,
          status,
        ];
      }),
    ];
    downloadCsv(rows, `statistik_${format(now, "yyyy-MM")}.csv`);
  };

  return (
    <div className="psl-page" style={{ maxWidth: 1100 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>Statistiken</h1>
            <p style={{ fontSize: 14, marginBottom: 0 }}>Übersicht aller Kurse und Buchungen</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading}>
            <Download className="w-4 h-4 mr-1.5" />
            CSV Export
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Row 1: Gesamtstatistik */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="psl-admin-hero-row"
            >
              <div className="psl-admin-hero-card dark">
                <p className="psl-admin-hero-label">Kurse gesamt</p>
                <span className="psl-admin-hero-number">{totalCourses}</span>
              </div>
              <div className="psl-admin-hero-card light">
                <p className="psl-admin-hero-label">Teilnehmende gesamt</p>
                <span className="psl-admin-hero-number">{totalParticipants}</span>
              </div>
              <div className="psl-admin-hero-card light">
                <p className="psl-admin-hero-label">Bestätigte Buchungen</p>
                <span className="psl-admin-hero-number">{totalBookings}</span>
              </div>
            </motion.div>

            {/* Row 2: Vergangene Kurse + YSSA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="psl-admin-row2"
            >
              {pastCourses.length > 0 && (
                <div className="psl-admin-card">
                  <p className="psl-admin-card-label">Vergangene Kurse</p>
                  <div className="psl-admin-tile-row">
                    <div className="psl-admin-tile success">
                      <p className="psl-admin-tile-label">Stattgefunden</p>
                      <span className="psl-admin-tile-num">{coursesHeld.length}</span>
                    </div>
                    <div className="psl-admin-tile warning">
                      <p className="psl-admin-tile-label">Nicht stattgef.</p>
                      <span className="psl-admin-tile-num">{coursesCancelled.length}</span>
                    </div>
                  </div>
                </div>
              )}
              {yssaCourses.length > 0 && (
                <div className="psl-admin-card">
                  <p className="psl-admin-card-label">YSSA Kurse</p>
                  <div className="psl-admin-tile-row">
                    <div className="psl-admin-tile yssa">
                      <span className="psl-admin-tile-num">Kurse</span>
                      <p className="psl-admin-tile-label">{yssaCourses.length}</p>
                    </div>
                    <div className="psl-admin-tile yssa">
                      <span className="psl-admin-tile-num">Teilnehmende</span>
                      <p className="psl-admin-tile-label">{yssaParticipants}</p>
                    </div>
                    <div className="psl-admin-tile yssa">
                      <span className="psl-admin-tile-num">Buchungen</span>
                      <p className="psl-admin-tile-label">{yssaBookings}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Row 3: Aktueller Monat */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="psl-admin-card"
            >
              <div className="psl-admin-month-header">
                <p className="psl-admin-card-label">Aktueller Monat</p>
                <span className="psl-admin-month-badge">{format(now, "MMMM yyyy", { locale: de })}</span>
              </div>
              <div className="psl-admin-month-tiles">
                <div className="psl-admin-month-tile">
                  <p className="psl-admin-month-tile-label">Kurse</p>
                  <span className={`psl-admin-month-num${currentMonthCourses.length === 0 ? ' is-zero' : ''}`}>
                    {currentMonthCourses.length}
                  </span>
                </div>
                <div className="psl-admin-month-tile">
                  <p className="psl-admin-month-tile-label">Teilnehmende</p>
                  <span className={`psl-admin-month-num${monthParticipants === 0 ? ' is-zero' : ''}`}>
                    {monthParticipants}
                  </span>
                </div>
                <div className="psl-admin-month-tile">
                  <p className="psl-admin-month-tile-label">Buchungen</p>
                  <span className={`psl-admin-month-num${currentMonthBookings.length === 0 ? ' is-zero' : ''}`}>
                    {currentMonthBookings.length}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Chart Row: Kurse pro Tutor:in */}
            {tutorData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.24 }}
                className="psl-admin-chart-card"
              >
                <p className="psl-admin-chart-title">Kurse pro Tutor:in (aktueller Monat)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tutorData} margin={{ top: 4, right: 16, left: 0, bottom: 8 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [value, name === "courses" ? "Kurse" : "Teilnehmende"]}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar dataKey="courses" radius={[6, 6, 0, 0]}>
                      {tutorData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Row 4: Tutor:innen */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.30 }}
              className="psl-admin-row4"
            >
              {pastTutorData.length > 0 && (
                <div className="psl-admin-card">
                  <p className="psl-admin-tutor-card-title">Kurse nach Tutor:in</p>
                  {pastTutorData.map((t) => (
                    <div key={t.name} className="psl-admin-tutor-row">
                      <div className="psl-admin-tutor-identity">
                        <div className="psl-admin-avatar-circle">{getInitials(t.name)}</div>
                        <span className="psl-admin-tutor-name">{t.name}</span>
                      </div>
                      <div className="psl-admin-tutor-stats">
                        <span className="psl-admin-tutor-held">✓ {t.held} durchgeführt</span>
                        <span className="psl-admin-tutor-cancelled">✗ {t.cancelled} nicht stattgef.</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="psl-admin-card psl-admin-detail-card">
                <p className="psl-admin-tutor-card-title">Tutor:innen im Detail</p>
                <p className="psl-admin-tutor-subtitle">Aktueller Monat · {format(now, "MMMM yyyy", { locale: de })}</p>
                {tutorData.length === 0 ? (
                  <div className="psl-admin-empty-state">
                    <div style={{ textAlign: "center" }}>
                      <Users className="psl-admin-empty-state-icon" width={32} height={32} />
                      <p className="psl-admin-empty-state-text">Keine Daten für diesen Monat</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {tutorData.map((tutor) => (
                      <div key={tutor.name} className="psl-admin-tutor-row">
                        <div className="psl-admin-tutor-identity">
                          <div className="psl-admin-avatar-circle">{getInitials(tutor.name)}</div>
                          <span className="psl-admin-tutor-name">{tutor.name}</span>
                        </div>
                        <div className="psl-admin-tutor-stats">
                          <span style={{ fontSize: "13px", color: "var(--psl-text-2)" }}>
                            {tutor.courses} Kurse
                          </span>
                          <span style={{ fontSize: "13px", color: "var(--psl-text-2)" }}>
                            {tutor.participants} Teilnehmende
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Row 5: Archivierte Monate */}
            {snapshots.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.36 }}
                className="psl-admin-card psl-admin-archive-card"
              >
                <div className="psl-admin-archive-header">
                  <Archive className="w-4 h-4" />
                  <p className="psl-admin-archive-title">Archivierte Monate</p>
                </div>
                <div className="psl-admin-archive-list">
                    {snapshots.map((snap) => {
                      const parsedTutors = (() => { try { return JSON.parse(snap.tutor_data || "[]"); } catch { return []; } })();
                      const parsedCourses = (() => { try { return JSON.parse(snap.course_data || "[]"); } catch { return []; } })();
                      const handleSnapExport = () => {
                        const rows = [
                          ["Monat", "Kursname", "Tutor:in", "Datum", "Zeit", "Teilnehmende", "Max. Plätze"],
                        ];
                        if (parsedCourses.length > 0) {
                          parsedCourses.forEach((c) => rows.push([snap.month_label, c.title || "—", c.instructor || "—", c.date || "—", c.time || "—", c.current_participants, c.max_participants]));
                        } else {
                          // Fallback für alte Snapshots ohne course_data — die
                          // Zeilen brauchen genauso viele Spalten wie der Header,
                          // sonst rutscht "Teilnehmende" in die Spalte "Zeit".
                          parsedTutors.forEach((t) => rows.push([snap.month_label, "—", t.name, "—", "—", t.participants, "—"]));
                          if (parsedTutors.length === 0) rows.push([snap.month_label, "—", "—", "—", "—", snap.total_participants, "—"]);
                        }
                        downloadCsv(rows, `statistik_${snap.month_label.replace(" ", "_")}.csv`);
                      };
                      const handleSnapDelete = async () => {
                        try {
                          await peerskillslab.entities.MonthlyStatSnapshot.delete(snap.id);
                          queryClient.invalidateQueries({ queryKey: queryKeys.statsSnapshots() });
                        } catch {
                          toast({
                            title: "Archiv konnte nicht gelöscht werden",
                            description: "Bitte versuche es später erneut.",
                            variant: "destructive",
                          });
                        }
                      };
                      return (
                        <div key={snap.id} className="psl-admin-archive-row">
                          <div className="psl-admin-archive-left">
                            <div className="psl-admin-archive-icon-box">
                              <Calendar />
                            </div>
                            <span className="psl-admin-archive-month">{snap.month_label}</span>
                          </div>
                          <div className="psl-admin-archive-right">
                            <div className="psl-admin-archive-stats">
                              <span className="psl-admin-archive-stat">
                                <strong>{snap.total_courses}</strong> Kurse
                              </span>
                              <span className="psl-admin-archive-stat">
                                <strong>{snap.total_participants}</strong> Teilnehmende
                              </span>
                              <span className="psl-admin-archive-stat">
                                <strong>{snap.total_bookings}</strong> Buchungen
                              </span>
                            </div>
                            <div className="psl-admin-archive-actions">
                              <button className="psl-btn" onClick={handleSnapExport}>
                                <Download className="w-3.5 h-3.5" />
                                CSV
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="psl-admin-delete-btn">
                                    <Trash2 />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Monats-Snapshot löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Der Eintrag für <strong>{snap.month_label}</strong> wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSnapDelete} className="bg-destructive hover:bg-destructive/90">
                                      Löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
            )}
          </div>
        )}
    </div>
  );
}