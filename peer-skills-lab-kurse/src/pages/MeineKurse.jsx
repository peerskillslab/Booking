// @ts-nocheck
import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, Trash2, Loader2, Users, Archive, Mail, Calendar } from "lucide-react";
import { downloadICalFile } from "@/lib/icalGenerator";
import { format, isPast, endOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import BookingsDialog from "@/components/tutor/BookingsDialog";
import AttendanceDialog from "@/components/tutor/AttendanceDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { queryKeys } from "@/lib/queryKeys";

export default function MeineKurse() {
  const [user, setUser] = useState(null);
  const [bookingsDialogOpen, setBookingsDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    peerskillslab.auth.me().then((u) => {
      if (u.role !== "admin" && u.role !== "tutor") {
        window.location.href = "/";
        return;
      }
      setUser(u);
    }).catch(() => {
      peerskillslab.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: myCourses = [], isLoading, refetch } = useQuery({
    queryKey: ["tutorCourses", user?.email],
    queryFn: async () => {
      const allCourses = await peerskillslab.entities.Course.list();
      return allCourses
        .filter(c => c.instructor === (user?.full_name || user?.email))
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    },
    enabled: !!user,
  });

  useEffect(() => {
    const unsubscribe = peerskillslab.entities.Course.subscribe(() => {
      setTimeout(() => refetch(), 1000);
    });
    return unsubscribe;
  }, [refetch]);

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

  const upcoming = myCourses.filter(c => !isPast(endOfDay(new Date(c.date))));
  const past     = myCourses.filter(c =>  isPast(endOfDay(new Date(c.date))));

  const CourseRow = ({ course, i, isPastCourse }) => (
    <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
      <Card className={`border-border/60 ${isPastCourse ? "opacity-75" : ""}`}>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-semibold truncate ${isPastCourse ? "text-muted-foreground" : ""}`}>{course.title}</span>
              <Badge variant="secondary" className="text-xs">{course.category}</Badge>
              {isPastCourse ? (
                <Badge className="text-xs border bg-muted text-muted-foreground border-border">Abgeschlossen</Badge>
              ) : (
                <Badge className={`text-xs border ${
                  course.status === "active" ? "bg-primary/10 text-primary border-primary/20" :
                  course.status === "cancelled" ? "bg-destructive/10 text-destructive border-destructive/20" :
                  "bg-muted text-muted-foreground border-border"}`}>
                  {course.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {course.date && <span>{format(new Date(course.date), "dd.MM.yyyy", { locale: de })}</span>}
              {course.time && <span>{course.time}</span>}
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {course.current_participants || 0}/{course.max_participants}
              </span>
            </div>
          </div>
          {!isPastCourse && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => downloadICalFile(course)} title="Zu Kalender hinzufügen">
                <Calendar className="w-3.5 h-3.5 mr-1" /> Kalendereintrag
              </Button>
              <Button variant="outline" size="sm" onClick={() => openBookings(course)}>
                <Mail className="w-3.5 h-3.5 mr-1" /> Buchungen
              </Button>
              {(course.current_participants || 0) === 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
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
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCourseMutation.mutate(course.id)}
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
                {upcoming.map((course, i) => <CourseRow key={course.id} course={course} i={i} isPastCourse={false} />)}
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
                {past.map((course, i) => <CourseRow key={course.id} course={course} i={i} isPastCourse={true} />)}
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
