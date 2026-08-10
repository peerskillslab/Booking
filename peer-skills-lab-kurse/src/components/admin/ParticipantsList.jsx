import React from "react";
import { useQuery } from "@tanstack/react-query";
import { peerskillslab } from "@/api/peerskillslabClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Mail } from "lucide-react";
import { formatCourseDate } from "@/lib/courseUtils";
import { queryKeys } from "@/lib/queryKeys";

export default function ParticipantsList({ course }) {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: queryKeys.courseParticipants(course.id),
    queryFn: () => peerskillslab.entities.Booking.filter({
      course_id: course.id,
      status: "confirmed",
    }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Noch keine Teilnehmenden gebucht.</p>
      </div>
    );
  }

  const handleMailAll = () => {
    const emails = bookings.map((b) => b.user_email).filter(Boolean).join(",");
    window.location.href = `mailto:${emails}?subject=${encodeURIComponent(course.title)}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">
          {bookings.length} von {course.max_participants} Plätzen belegt
        </span>
        <Button variant="outline" size="sm" onClick={handleMailAll}>
          <Mail className="w-3.5 h-3.5 mr-1.5" />
          E-Mail an alle
        </Button>
      </div>
      {bookings.map((booking) => (
        <Card key={booking.id} className="border-border/60">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{booking.user_name || booking.user_email}</p>
              {booking.notes && (
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCourseDate(booking.created_date)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}