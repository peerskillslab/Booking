import React, { useState, useEffect, useMemo, useCallback } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/ui/PullToRefreshIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2, BookOpen, XCircle, MessageSquare, AlertTriangle } from "lucide-react";
import FeedbackDialog from "@/components/feedback/FeedbackDialog";
import { format, isBefore, subHours } from "date-fns";
import { de } from "date-fns/locale";
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

const MIN_PARTICIPANTS_THRESHOLD = 3;

const STATUS_LABELS = {
  confirmed: { label: "Bestätigt", className: "bg-primary/10 text-primary border-primary/20" },
  cancelled: { label: "Storniert", className: "bg-destructive/10 text-destructive border-destructive/20" },
  pending: { label: "Ausstehend", className: "bg-accent/10 text-accent border-accent/20" },
};

function getCourseStartDate(course) {
  if (!course?.date) return null;
  try {
    let dateStr = course.date;
    if (typeof dateStr !== "string") {
      if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().split("T")[0];
      } else {
        return null;
      }
    }
    const timeStr = course.time && course.time.length >= 5 ? course.time.substring(0, 5) : "00:00";
    const date = new Date(`${dateStr}T${timeStr}:00`);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function BookingRow({ booking, course, status, action, lowParticipantsMessage }) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${lowParticipantsMessage ? "border-amber-300" : "border-border/60"}`}>
      {lowParticipantsMessage && (
        <div className="flex items-center gap-2 px-5 pt-3 pb-0 text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{lowParticipantsMessage}</span>
        </div>
      )}
      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={createPageUrl("CourseDetail") + `?id=${booking.course_id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {booking.course_title}
            </Link>
            <Badge className={`${status.className} border text-xs`}>
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {course?.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(`${course.date}T00:00:00`), "dd.MM.yyyy", { locale: de })}
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
  const [user, setUser] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ["myBookings"] });
  }, [queryClient]);

  const { pullDistance, isRefreshing, containerRef, handlers } = usePullToRefresh(handleRefresh);

  useEffect(() => {
    peerskillslab.auth.me().then(setUser).catch(() => {
      peerskillslab.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["myBookings", user?.email],
    queryFn: () => peerskillslab.entities.Booking.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["myBookingsCourses", user?.email],
    queryFn: () => peerskillslab.entities.Course.list("-date"),
    enabled: !!user?.email,
  });

  const courseMap = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])),
    [courses]
  );

  const { data: userFeedbacks = [] } = useQuery({
    queryKey: ["myFeedbacks", user?.email],
    queryFn: () => peerskillslab.entities.CourseFeedback.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const feedbackedCourseIds = useMemo(
    () => new Set(userFeedbacks.map((fb) => fb.course_id)),
    [userFeedbacks]
  );

  const cancelMutation = useMutation({
    mutationFn: async (booking) => {
      await peerskillslab.entities.Booking.update(booking.id, { status: "cancelled" });
      await peerskillslab.functions.invoke("updateCourseParticipants", {
        course_id: booking.course_id,
        increment: -1,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      await queryClient.invalidateQueries({ queryKey: ["myBookingsCourses"] });
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      await queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
    },
    onError: (err) => {
      if (err?.message === "cancellation_deadline_passed") {
        alert("Stornierung nicht mehr möglich (Frist von 72h vor Kursbeginn abgelaufen).");
      }
    },
  });

  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date();
    const upcoming = [];
    const past = [];

    bookings.forEach((booking) => {
      if (booking.status !== "confirmed") {
        upcoming.push(booking);
        return;
      }
      const course = courseMap[booking.course_id];
      if (!course) {
        upcoming.push(booking);
        return;
      }
      const courseStart = getCourseStartDate(course);
      if (courseStart && isBefore(courseStart, now)) {
        past.push(booking);
      } else {
        upcoming.push(booking);
      }
    });

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings, courseMap]);

  if (!user) return null;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background"
      style={{ overflowY: "auto", WebkitOverflowScrolling: "touch" }}
      {...handlers}
    >
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Meine Buchungen</h1>
          <p className="text-muted-foreground mb-8">Übersicht aller gebuchten Kurse</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
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
                      const courseStart = getCourseStartDate(course);
                      const canCancel = courseStart === null || isBefore(new Date(), subHours(courseStart, 72));
                      const action = booking.status === "confirmed" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canCancel}
                              className={canCancel ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground opacity-50 cursor-not-allowed"}
                              title={!canCancel ? "Stornierung nur bis 72h vor Kursbeginn möglich" : ""}
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
                            status={STATUS_LABELS[booking.status] || STATUS_LABELS.pending}
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

            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Vergangene Kurse
                </h2>
                <div className="space-y-4">
                  <AnimatePresence>
                    {pastBookings.map((booking, i) => {
                      const alreadyFeedback = feedbackedCourseIds.has(booking.course_id);
                      const action = booking.status === "confirmed" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setFeedbackOpen(true);
                          }}
                          disabled={alreadyFeedback}
                          className={alreadyFeedback ? "text-muted-foreground opacity-50" : "text-primary hover:text-primary hover:bg-primary/10"}
                          title={alreadyFeedback ? "Rückmeldung bereits abgegeben" : ""}
                        >
                          {alreadyFeedback ? (
                            <>
                              <span className="w-4 h-4 mr-1.5 text-green-600">✓</span>
                              Abgegeben
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 mr-1.5" />
                              Rückmeldung
                            </>
                          )}
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
                            status={STATUS_LABELS[booking.status] || STATUS_LABELS.pending}
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

        {selectedBooking && courseMap[selectedBooking.course_id] && (
          <FeedbackDialog
            open={feedbackOpen}
            onOpenChange={setFeedbackOpen}
            course={courseMap[selectedBooking.course_id]}
            user={user}
            onSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: ["myFeedbacks"] });
            }}
          />
        )}
      </div>
    </div>
  );
}
