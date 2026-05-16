import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar, Clock, MapPin, Users, ArrowLeft, User,
  BarChart3, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BookingDialog from "@/components/booking/BookingDialog";

export default function CourseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    peerskillslab.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: course, isLoading, refetch } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const courses = await peerskillslab.entities.Course.list();
      return courses.find(c => c.id === courseId);
    },
    enabled: !!courseId,
  });

  const { data: userBookings = [] } = useQuery({
    queryKey: ["userBookings", courseId, user?.email],
    queryFn: async () => {
      const allBookings = await peerskillslab.entities.Booking.list();
      return allBookings.filter(b =>
        b.course_id === courseId &&
        b.user_email === user?.email &&
        b.status === "confirmed"
      );
    },
    enabled: !!courseId && !!user?.email,
  });

  const alreadyBooked = userBookings.length > 0;
  const spotsLeft = (course?.max_participants || 0) - (course?.current_participants || 0);
  const isFull = spotsLeft <= 0;
  const isOwnCourse = user && course && (
    (user.full_name && user.full_name === course.instructor) ||
    user.email === course.instructor
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-5xl">😕</p>
        <h2 className="text-xl font-semibold">Kurs nicht gefunden</h2>
        <Link to={createPageUrl("Home")}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header image or gradient */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 overflow-hidden">
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl opacity-20">📚</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute top-4 left-4 md:top-6 md:left-6">
          <Link to={createPageUrl("Home")}>
            <Button variant="secondary" size="sm" className="bg-card/80 backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-20 relative z-10 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-primary/10 text-primary border-primary/20 border">
                  {course.category}
                </Badge>
                {course.level && (
                  <Badge variant="secondary">{course.level}</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
                {course.title}
              </h1>
              {course.instructor && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" /> mit {course.instructor}
                </p>
              )}
            </div>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-3">Beschreibung</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {course.description || course.short_description || "Keine Beschreibung vorhanden."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="border-border/60 shadow-lg shadow-primary/5 sticky top-6">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-3">
                  {course.date && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{format(new Date(course.date), "EEEE, dd. MMMM yyyy", { locale: de })}</span>
                    </div>
                  )}
                  {course.time && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{course.time}</span>
                    </div>
                  )}
                  {course.duration_minutes && (
                    <div className="flex items-center gap-3 text-sm">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span>{course.duration_minutes} Minuten</span>
                    </div>
                  )}
                  {course.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{course.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    <span>
                      {course.current_participants || 0} / {course.max_participants} Teilnehmer
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((course.current_participants || 0) / (course.max_participants || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {isFull
                    ? "Dieser Kurs ist ausgebucht"
                    : `Noch ${spotsLeft} ${spotsLeft === 1 ? "Platz" : "Plätze"} frei`}
                </p>

                {isOwnCourse ? (
                   <div className="text-center p-3 bg-muted rounded-xl">
                     <p className="text-sm font-medium text-muted-foreground">Das ist dein Kurs</p>
                   </div>
                 ) : alreadyBooked ? (
                   <div className="text-center p-3 bg-primary/5 rounded-xl">
                     <p className="text-sm font-medium text-primary">✓ Du bist bereits angemeldet</p>
                   </div>
                 ) : (
                   <Button
                     className="w-full h-12 text-base rounded-xl"
                     disabled={isFull}
                     onClick={() => {
                       if (!user) {
                         peerskillslab.auth.redirectToLogin(window.location.href);
                       } else {
                         setBookingOpen(true);
                       }
                     }}
                   >
                     {isFull ? "Ausgebucht" : "Jetzt buchen"}
                   </Button>
                 )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      {course && user && (
        <BookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          course={course}
          user={user}
          onBooked={() => {
            setTimeout(() => refetch(), 1000);
          }}
        />
      )}
    </div>
  );
}