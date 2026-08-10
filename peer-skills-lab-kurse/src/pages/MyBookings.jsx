// @ts-nocheck
import React, { useEffect, useMemo } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, BookOpen, XCircle, ExternalLink, AlertTriangle, Download, RotateCcw, Mail } from "lucide-react";
import { downloadICalFile } from "@/lib/icalGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
import {
  isCancellationWindowOpen, isCoursePast, formatCourseDate,
  MIN_PARTICIPANTS_THRESHOLD, CANCELLATION_WINDOW_HOURS,
} from "@/lib/courseUtils";
import { invalidateOnBookingCancel } from "@/lib/invalidationStrategy";
import { useAuth } from "@/lib/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge } from "@/components/courses/CategoryBadge";

function BookingRow({ booking, course, status, action, lowParticipantsMessage }) {
  return (
    <Card className={lowParticipantsMessage ? "border-amber-300" : "border-border/60"}>
      {lowParticipantsMessage && (
        <div className="flex items-center gap-2 px-5 pt-3 pb-0 text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{lowParticipantsMessage}</span>
        </div>
      )}
      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {course?.kurs_nr && (
              <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">K-{String(course.kurs_nr).padStart(3, '0')}</span>
            )}
            <Link
              to={createPageUrl("CourseDetail") + `?id=${booking.course_id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {booking.course_title}
            </Link>
            <StatusBadge status={status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {course?.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatCourseDate(course.date)}
              </span>
            )}
            {course?.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {course.time}
              </span>
            )}
          </div>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export default function MyBookings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      peerskillslab.auth.redirectToLogin(window.location.href);
    }
  }, [user, isLoadingAuth]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: queryKeys.myBookings(user?.email),
    queryFn: () => peerskillslab.entities.Booking.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: queryKeys.myBookingsCourses(user?.email),
    queryFn: () => peerskillslab.entities.Course.list("-date"),
    enabled: !!user?.email,
  });

  const courseMap = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])),
    [courses]
  );

  const cancelMutation = useMutation({
    mutationFn: async (booking) => {
      await peerskillslab.entities.Booking.update(booking.id, { status: "cancelled" });
    },
    onSuccess: async (result, booking) => {
      // Only invalidate affected queries: course participants + user bookings
      invalidateOnBookingCancel(queryClient, booking.course_id, user?.email);
    },
    onError: (err) => {
      // Vorher wurde jeder andere Fehler (500, Netzwerk) still verschluckt und
      // die Buchung sah weiterhin bestätigt aus.
      toast({
        title: "Stornierung fehlgeschlagen",
        description: err?.message === "cancellation_deadline_passed"
          ? `Die Frist von ${CANCELLATION_WINDOW_HOURS}h vor Kursbeginn ist abgelaufen.`
          : "Bitte versuche es später erneut.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const { upcomingBookings, cancelledBookings, pastBookings } = useMemo(() => {
    const upcoming = [];
    const past = [];

    // Courses with an active confirmed booking — suppress cancelled entries for these
    const confirmedCourseIds = new Set(
      bookings.filter((b) => b.status === "confirmed").map((b) => b.course_id)
    );

    // Deduplicate cancelled: one entry per course, only future courses
    const cancelledByCourse = {};

    bookings.forEach((booking) => {
      if (booking.status === "cancelled") {
        if (!confirmedCourseIds.has(booking.course_id)) {
          const course = courseMap[booking.course_id];
          if (!isCoursePast(course)) {
            if (!cancelledByCourse[booking.course_id]) {
              cancelledByCourse[booking.course_id] = booking;
            }
          }
        }
        return;
      }

      if (booking.status !== "confirmed") {
        upcoming.push(booking);
        return;
      }

      const course = courseMap[booking.course_id];
      if (!course) {
        upcoming.push(booking);
        return;
      }
      if (isCoursePast(course)) {
        past.push(booking);
      } else {
        upcoming.push(booking);
      }
    });

    return {
      upcomingBookings: upcoming,
      cancelledBookings: Object.values(cancelledByCourse),
      pastBookings: past,
    };
  }, [bookings, courseMap]);

  if (!user) return null;

  return (
    <div className="psl-page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Meine Buchungen</h1>
          <p className="text-muted-foreground mb-8">Übersicht aller gebuchten Kurse</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : bookings.length === 0 || (upcomingBookings.length === 0 && cancelledBookings.length === 0 && pastBookings.length === 0) ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Noch keine Buchungen</h3>
            <p className="text-muted-foreground mb-6">Entdecke unsere Kurse und buche deinen ersten!</p>
            <Link to={createPageUrl("Home")}>
              <Button>Kurse entdecken</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Kommende Kurse
                </h2>
                <div className="space-y-4">
                  <AnimatePresence>
                    {upcomingBookings.map((booking, i) => {
                      const course = courseMap[booking.course_id];
                      const canCancel = isCancellationWindowOpen(course);
                      const handleContactTutor = () => {
                        // instructor_email wandert bei einem Tutorwechsel mit;
                        // created_by bleibt beim ursprünglichen Ersteller stehen
                        // und ist nur der Fallback für Altbestände.
                        const tutorEmail = course?.instructor_email || course?.created_by;
                        const tutorName = course?.instructor || 'Tutor:in';
                        const subject = encodeURIComponent(`Frage zu meiner Buchung: ${booking.course_title}`);
                        const body = encodeURIComponent(
                          `Hallo ${tutorName},\n\nIch habe eine Frage oder Mitteilung zu meiner Buchung für "${booking.course_title}":\n\n`
                        );
                        window.location.href = `mailto:${tutorEmail}?subject=${subject}&body=${body}`;
                      };

                      const action = booking.status === "confirmed" ? (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            onClick={() => downloadICalFile(course)}
                            title="Zu Kalender hinzufügen"
                            style={{ height: 34, borderRadius: 9 }}
                          >
                            <Download className="w-4 h-4 mr-1.5" />
                            Kalendereintrag hinzufügen
                          </Button>
                          {(course?.instructor_email || course?.created_by) && (
                            <Button
                              variant="outline"
                              onClick={handleContactTutor}
                              title="Tutor kontaktieren"
                              style={{ height: 34, borderRadius: 9 }}
                            >
                              <Mail className="w-4 h-4 mr-1.5" />
                              Tutor kontaktieren
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                disabled={!canCancel}
                                className={canCancel ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground opacity-50 cursor-not-allowed"}
                                title={!canCancel ? `Stornierung nur bis ${CANCELLATION_WINDOW_HOURS}h vor Kursbeginn möglich` : ""}
                                style={{ height: 34, borderRadius: 9 }}
                              >
                                <XCircle className="w-4 h-4 mr-1.5" />
                                Stornieren
                              </Button>
                            </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Buchung stornieren?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Möchtest du deine Buchung für „{booking.course_title}" wirklich stornieren?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelMutation.mutate(booking)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Ja, stornieren
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : null;

                      const lowParticipantsMessage =
                        booking.status === "confirmed" &&
                        course?.current_participants != null &&
                        course.current_participants < MIN_PARTICIPANTS_THRESHOLD
                          ? `Dieser Kurs findet möglicherweise nicht statt – aktuell nur ${course.current_participants} Teilnehmende angemeldet.`
                          : null;

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <BookingRow
                            booking={booking}
                            course={course}
                            status={booking.status || "pending"}
                            action={action}
                            lowParticipantsMessage={lowParticipantsMessage}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {cancelledBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Stornierte Buchungen
                </h2>
                <div className="space-y-4">
                  <AnimatePresence>
                    {cancelledBookings.map((booking, i) => {
                      const course = courseMap[booking.course_id];
                      const action = (
                        <Link to={createPageUrl("CourseDetail") + `?id=${booking.course_id}`}>
                          <Button
                            variant="outline"
                            className="text-primary border-primary/30 hover:bg-primary/10"
                            style={{ height: 34, borderRadius: 9 }}
                          >
                            <RotateCcw className="w-4 h-4 mr-1.5" />
                            Wieder anmelden
                          </Button>
                        </Link>
                      );
                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <BookingRow
                            booking={booking}
                            course={course}
                            status="cancelled"
                            action={action}
                            lowParticipantsMessage={null}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Vergangene Kurse
                </h2>
                <div className="space-y-4">
                  <AnimatePresence>
                    {pastBookings.map((booking, i) => {
                      const action = booking.status === "confirmed" ? (
                        <Button
                          variant="ghost"
                          onClick={() => window.open("https://forms.cloud.microsoft/e/sZ3XW4XpMy", "_blank")}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          style={{ height: 34, borderRadius: 9 }}
                        >
                          <ExternalLink className="w-4 h-4 mr-1.5" />
                          Rückmeldung
                        </Button>
                      ) : null;

                      return (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <BookingRow
                            booking={booking}
                            course={courseMap[booking.course_id]}
                            status={booking.status || "pending"}
                            action={action}
                            lowParticipantsMessage={null}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}

    </div>
  );
}
