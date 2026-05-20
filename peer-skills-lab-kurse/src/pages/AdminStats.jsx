// @ts-nocheck
import React, { useEffect, useState } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Users, TrendingUp, Award, Download, Archive, Trash2 } from "lucide-react";
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


const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdminStats() {
  const [currentUser, setCurrentUser] = useState(null);
  const [resetting, setResetting] = useState(false);
  const autoSnapshotRef = React.useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    peerskillslab.auth.me().then((u) => {
      if (u?.role !== "admin") {
        window.location.href = "/";
      } else {
        setCurrentUser(u);
      }
    }).catch(() => peerskillslab.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["statsCourses"],
    queryFn: () => peerskillslab.entities.Course.list("-date"),
    enabled: !!currentUser,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["statsBookings"],
    queryFn: () => peerskillslab.entities.Booking.filter({ status: "confirmed" }),
    enabled: !!currentUser,
  });

  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ["statsSnapshots"],
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
      const d = new Date(c.date);
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

    peerskillslab.entities.MonthlyStatSnapshot.create(snapshotData).then(() => {
      queryClient.invalidateQueries({ queryKey: ["statsSnapshots"] });
    });
  }, [currentUser, coursesLoading, bookingsLoading, snapshotsLoading, courses, bookings, snapshots]);

  if (!currentUser) return null;

  const isLoading = coursesLoading || bookingsLoading;

  // Aktuelle Monatsstatistik (nur Kurse dieses Monats)
  const now = new Date();
  const currentMonthCourses = courses.filter((c) => {
    if (!c.date) return false;
    const d = new Date(c.date);
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
  const pastCourses = courses.filter((c) => c.date && new Date(`${c.date}T00:00:00`) < now);
  const coursesHeld = pastCourses.filter((c) => (c.current_participants || 0) >= 3);
  const coursesCancelled = pastCourses.filter((c) => (c.current_participants || 0) < 3);

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
    if ((c.current_participants || 0) >= 3) pastTutorMap[name].held += 1;
    else pastTutorMap[name].cancelled += 1;
  });
  const pastTutorData = Object.entries(pastTutorMap)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  // Reset – alle Daten löschen
  const handleReset = async () => {
    setResetting(true);
    try {
      await peerskillslab.functions.invoke("resetAllData", {});
      await queryClient.invalidateQueries();
      autoSnapshotRef.current = false;
    } finally {
      setResetting(false);
    }
  };

  // CSV Export (aktueller Monat) – einzelne Kurse
  const handleExportCSV = () => {
    const monthLabel = format(now, "MMMM yyyy", { locale: de });
    const rows = [
      ["Monat", "Kursname", "Tutor:in", "Datum", "Zeit", "Teilnehmende", "Max. Plätze", "Status"],
      ...currentMonthCourses.map((c) => {
        const isPast = c.date && new Date(`${c.date}T00:00:00`) < now;
        const status = !isPast ? "Ausstehend" : (c.current_participants || 0) >= 3 ? "Stattgefunden" : "Nicht stattgefunden";
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
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statistik_${format(now, "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Statistiken</h1>
              <p className="text-muted-foreground mt-0.5">Übersicht aller Kurse und Buchungen</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading}>
              <Download className="w-4 h-4 mr-1.5" />
              CSV Export
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" disabled={resetting}>
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Zurücksetzen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alle Daten löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion löscht <strong>alle Kurse, Buchungen und Statistiken</strong> unwiderruflich. Die Kurs-Nummern starten danach wieder bei K-001. Benutzerkonten bleiben erhalten.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ja, alles löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Gesamtstatistik */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Gesamtstatistik</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kurse gesamt</p>
                      <p className="text-3xl font-bold text-foreground">{totalCourses}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teilnehmende gesamt</p>
                      <p className="text-3xl font-bold text-foreground">{totalParticipants}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bestätigte Buchungen</p>
                      <p className="text-3xl font-bold text-foreground">{totalBookings}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Vergangene Kurse – stattgefunden vs. nicht stattgefunden */}
            {pastCourses.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vergangene Kurse</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-green-200/60">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-green-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stattgefunden</p>
                        <p className="text-3xl font-bold text-green-700">{coursesHeld.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200/60">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nicht stattgefunden</p>
                        <p className="text-3xl font-bold text-amber-700">{coursesCancelled.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* YSSA Kurse */}
            {yssaCourses.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">YSSA Kurse</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-border/60">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-violet-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Kurse</p>
                        <p className="text-3xl font-bold text-foreground">{yssaCourses.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-violet-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Teilnehmende</p>
                        <p className="text-3xl font-bold text-foreground">{yssaParticipants}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-violet-700" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Buchungen</p>
                        <p className="text-3xl font-bold text-foreground">{yssaBookings}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Aktueller Monat */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Aktueller Monat – {format(now, "MMMM yyyy", { locale: de })}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Kurse</p>
                    <p className="text-3xl font-bold text-primary">{currentMonthCourses.length}</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Teilnehmende</p>
                    <p className="text-3xl font-bold text-primary">{monthParticipants}</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Buchungen</p>
                    <p className="text-3xl font-bold text-primary">{currentMonthBookings.length}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Chart */}
            {tutorData.length > 0 && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Kurse pro Tutor:in (aktueller Monat)</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {/* Tutor Tabelle */}
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Tutor:innen im Detail (aktueller Monat)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/60">
                  {tutorData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Keine Daten für diesen Monat</p>
                  ) : (
                    tutorData.map((tutor, i) => (
                      <div key={tutor.name} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="font-medium text-foreground">{tutor.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {tutor.courses} Kurse
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {tutor.participants} Teilnehmende
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Durchgeführte Kurse nach Tutor:in (alle vergangenen Kurse) */}
            {pastTutorData.length > 0 && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Durchgeführte Kurse nach Tutor:in</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/60">
                    {pastTutorData.map((t) => (
                      <div key={t.name} className="flex items-center justify-between py-3">
                        <span className="font-medium text-foreground">{t.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-700 font-medium">✓ {t.held} durchgeführt</span>
                          <span className="text-amber-700 font-medium">✗ {t.cancelled} nicht stattgef.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Archivierte Monats-Snapshots */}
            {snapshots.length > 0 && (
              <Card className="border-border/60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-muted-foreground" />
                    <CardTitle className="text-lg">Archivierte Monate</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/60">
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
                          // Fallback für alte Snapshots ohne course_data
                          parsedTutors.forEach((t) => rows.push([snap.month_label, "—", t.name, "—", t.participants, "—"]));
                          if (parsedTutors.length === 0) rows.push([snap.month_label, "—", "—", "—", snap.total_participants, "—"]);
                        }
                        const csv = rows.map((r) => r.join(";")).join("\n");
                        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `statistik_${snap.month_label.replace(" ", "_")}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      };
                      const handleSnapDelete = async () => {
                        await peerskillslab.entities.MonthlyStatSnapshot.delete(snap.id);
                        queryClient.invalidateQueries({ queryKey: ["statsSnapshots"] });
                      };
                      return (
                        <div key={snap.id} className="flex items-center justify-between py-3 flex-wrap gap-2">
                          <span className="font-medium text-foreground">{snap.month_label}</span>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{snap.total_courses} Kurse</span>
                            <span>{snap.total_participants} Teilnehmende</span>
                            <span>{snap.total_bookings} Buchungen</span>
                            <Button variant="ghost" size="sm" onClick={handleSnapExport} className="h-7 px-2">
                              <Download className="w-3.5 h-3.5 mr-1" />
                              CSV
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
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
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}