import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery } from "@tanstack/react-query";
import { Mail, Loader2, Users } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";

export default function BookingsDialog({ open, onOpenChange, course, onBookingAdded }) {
  const { data: bookings = [], isLoading: loadingBookings, refetch } = useQuery({
    queryKey: ["courseBookings", course?.id],
    queryFn: () => {
      if (!course?.id) return [];
      return peerskillslab.entities.Booking.filter(
        { course_id: course.id, status: "confirmed" },
        "-created_date"
      );
    },
    enabled: open && !!course?.id,
    staleTime: 0,
  });

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleOpenEmailClient = () => {
    const emails = bookings.map(b => b.user_email).join(",");
    const subject = encodeURIComponent(`Informationen zu: ${course.title}`);
    const body = encodeURIComponent(`Hallo,\n\nHier sind wichtige Informationen zum Kurs "${course.title}":\n\n\n\nViele Grüße`);
    
    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
    onOpenChange(false);
    onBookingAdded?.();
  };

  const handleClose = () => {
    refetch();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Buchungen verwalten</DialogTitle>
          <DialogDescription>
            {course?.title} • {format(new Date(course?.date), "dd.MM.yyyy", { locale: de })}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-4"
        >
          {loadingBookings ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Noch keine Buchungen</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold">{bookings.length} Teilnehmende</span>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex justify-between items-start text-sm p-2 hover:bg-muted/70 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{booking.user_name}</p>
                        {booking.studienjahr && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {booking.studienjahr}. Jahr
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{booking.user_email}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleOpenEmailClient}
                className="w-full"
                size="lg"
              >
                <Mail className="w-4 h-4 mr-2" /> Mail an alle schreiben
              </Button>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}