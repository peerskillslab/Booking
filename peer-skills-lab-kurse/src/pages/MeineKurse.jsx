// @ts-nocheck
import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, Trash2, Loader2, Users, Archive, Mail, Calendar } from "lucide-react";
import { downloadICalFile } from "@/lib/icalGenerator";
import { isPast, endOfDay } from "date-fns";
import { motion } from "framer-motion";
import BookingsDialog from "@/components/tutor/BookingsDialog";
import AttendanceDialog from "@/components/tutor/AttendanceDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/lib/AuthContext";
import { CategoryBadge, StatusBadge } from "@/components/courses/CategoryBadge";
import { formatCourseDate, parseCourseDate } from "@/lib/courseUtils";

export default function MeineKurse() {
  const [bookingsDialogOpen, setBookingsDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const queryClient = useQueryClient();
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      peerskillslab.auth.redirectToLogin(window.location.href);
    } else if (user.role !== "admin" && user.role !== "tutor") {
      window.location.href = "/";
    }
  }, [user, isLoadingAuth]);

  const { data: myCourses = [], isLoading } = useQuery({
    queryKey: queryKeys.tutorCourses(user?.email),
    queryFn: async () => {
      const allCourses = await peerskillslab.entities.Course.list();
      return allCourses
        // Über die Adresse statt über den Anzeigenamen: so folgt "Meine Kurse"
        // einem Tutorwechsel und übersteht eine Namensänderung im Profil.
        .filter(c => (
          c.instructor_email
            ? c.instructor_email === user?.email
            : c.instructor === (user?.full_name || user?.email)
        ))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    },
    enabled: !!user,
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => peerskillslab.entities.Course.delete(id),
    onSuccess: () => {
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.tutorCourses(user?.email) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCourses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statsCourses() });
    },
    onError: (err) => {
      const errData = err.data || {};
      if (errData.error === 'course_has_bookings') {
        setDeleteError('Kurs kann nicht gelöscht werden, solange noch Buchungen vorhanden sind.');
      } else {
        setDeleteError(errData.error || 'Fehler beim Löschen des Kurses.');
      }
    },
  });

  const openBookings = (course) => {
    setSelectedCourse(course);
    setBookingsDialogOpen(true);
  };

  if (!user) return null;

  // Kurse ohne Datum gelten als kommend; parseCourseDate schützt vor
  // Invalid Date, das isPast() sonst still als "nicht vergangen" liest.
  const isCourseOver = (c) => {
    const d = parseCourseDate(c.date);
    return d ? isPast(endOfDay(d)) : false;
  };
  const upcoming = myCourses.filter(c => !isCourseOver(c));
  const past     = myCourses.filter(isCourseOver);

  const renderCourseRow = (course, i, isPastCourse) => (
    <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
      <Card className={`border-border/60 ${isPastCourse ? "opacity-75" : ""}`}>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-semibold truncate ${isPastCourse ? "text-muted-foreground" : ""}`}>{course.title}</span>
              <CategoryBadge category={course.category} />
              <StatusBadge status={isPastCourse ? "completed" : course.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span>{formatCourseDate(course.date)}</span>
              {course.time && <span>{course.time}</span>}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {course.current_participants || 0}/{course.max_participants}
              </span>
            </div>
          </div>
          {!isPastCourse && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => downloadICalFile(course)} title="Zu Kalender hinzufügen" style={{ height: 34, borderRadius: 9 }}>
                <Calendar className="w-3.5 h-3.5 mr-1" /> Kalendereintrag
              </Button>
              <Button variant="outline" onClick={() => openBookings(course)} style={{ height: 34, borderRadius: 9 }}>
                <Mail className="w-3.5 h-3.5 mr-1" /> Buchungen
              </Button>
              {(course.current_participants || 0) === 0 && (
                <AlertDialog onOpenChange={(open) => !open && setDeleteError(null)}>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" aria-label={`Kurs „${course.title}" löschen`} className="text-destructive hover:bg-destructive/10" style={{ height: 34, borderRadius: 9 }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Kurs löschen?</AlertDialogTitle>
                      <AlertDialogDescription>„{course.title}" wird unwiderruflich gelöscht.</AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                      <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                        {deleteError}
                      </div>
                    )}
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteError(null)}>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { setDeleteError(null); deleteCourseMutation.mutate(course.id); }}
                        disabled={deleteCourseMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {deleteCourseMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
          {isPastCourse && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCourse(course);
                setAttendanceDialogOpen(true);
              }}>
              <Users className="w-3.5 h-3.5 mr-1" /> Anwesenheiten bestätigen
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="psl-page">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : myCourses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <CalendarPlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground">Noch keine Kurse ausgeschrieben</p>
          <p className="text-sm text-muted-foreground mt-1">
            Gehe zu „Kurs ausschreiben" und schreibe deinen ersten Kurs aus.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Kommende Kurse</h3>
            {upcoming.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Keine kommenden Kurse</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((course, i) => renderCourseRow(course, i, false))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Archive className="w-5 h-5" /> Vergangene Kurse
            </h3>
            {past.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Keine vergangenen Kurse</p>
              </div>
            ) : (
              <div className="space-y-3">
                {past.map((course, i) => renderCourseRow(course, i, true))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCourse && (
        <>
          <BookingsDialog
            open={bookingsDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedCourse(null);
                queryClient.invalidateQueries({ queryKey: queryKeys.tutorCourses(user?.email) });
                queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
                queryClient.invalidateQueries({ queryKey: queryKeys.courseBookings(selectedCourse?.id) });
                queryClient.invalidateQueries({ queryKey: queryKeys.courseParticipants(selectedCourse?.id) });
                queryClient.invalidateQueries({ queryKey: queryKeys.statsBookings() });
              }
              setBookingsDialogOpen(open);
            }}
            course={selectedCourse}
          />
          <AttendanceDialog
            open={attendanceDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedCourse(null);
                queryClient.invalidateQueries({ queryKey: queryKeys.tutorCourses(user?.email) });
                queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
                queryClient.invalidateQueries({ queryKey: queryKeys.courseBookings(selectedCourse?.id) });
                queryClient.invalidateQueries({ queryKey: queryKeys.courseParticipants(selectedCourse?.id) });
                queryClient.invalidateQueries({ queryKey: queryKeys.statsBookings() });
              }
              setAttendanceDialogOpen(open);
            }}
            course={selectedCourse}
          />
        </>
      )}
    </div>
  );
}
