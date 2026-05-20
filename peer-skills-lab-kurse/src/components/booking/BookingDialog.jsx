import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Calendar } from "lucide-react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export default function BookingDialog({ open, onOpenChange, course, user, onBooked }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("form"); // form | success
  const [name, setName] = useState(user?.full_name || "");
  const [notes, setNotes] = useState("");

  const bookMutation = useMutation({
    mutationFn: async () => {
      // Check for duplicate booking
      const allBookings = await peerskillslab.entities.Booking.filter({
        course_id: course.id,
        user_email: user?.email || "",
        status: "confirmed",
      });
      if (allBookings.length > 0) throw new Error("DUPLICATE");

      // Increment participant count first (atomically checks capacity)
      await peerskillslab.functions.invoke("updateCourseParticipants", {
        course_id: course.id,
        increment: 1,
      });

      try {
        // Then create the booking
        await peerskillslab.entities.Booking.create({
          course_id: course.id,
          course_title: course.title,
          user_email: user?.email || "",
          user_name: name,
          status: "confirmed",
          notes,
          price_paid: 0,
        });
      } catch (err) {
        // If booking creation fails, rollback the participant count
        await peerskillslab.functions.invoke("updateCourseParticipants", {
          course_id: course.id,
          increment: -1,
        });
        throw err;
      }
    },

    // Optimistic update: bump participant count immediately
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["courses"] });
      const previous = queryClient.getQueryData(["courses"]);
      queryClient.setQueryData(["courses"], (old) =>
        old?.map((c) =>
          c.id === course.id
            ? { ...c, current_participants: (c.current_participants || 0) + 1 }
            : c
        )
      );
      return { previous };
    },

    onError: (err, _vars, ctx) => {
      // Roll back optimistic update
      if (ctx?.previous) queryClient.setQueryData(["courses"], ctx.previous);
      if (err.message === "DUPLICATE") {
        alert("Du hast diesen Kurs bereits gebucht!");
      } else if (err.message === "course_full") {
        alert("Der Kurs ist leider voll geworden.");
      } else {
        alert("Fehler beim Buchen: " + err.message);
      }
    },

    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["myBookings"] });
      queryClient.invalidateQueries({ queryKey: ["adminCourses"] });
      if (onBooked) onBooked();
    },
  });

  const handleBook = () => {
    if (!name.trim()) return;
    bookMutation.mutate();
  };

  const handleClose = () => {
    setStep("form");
    setName(user?.full_name || "");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {step === "form" && !bookMutation.isPending && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl">Kurs buchen</DialogTitle>
                <DialogDescription>
                  Bestätige deine Buchung für diesen Kurs.
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 p-4 bg-muted/50 rounded-xl space-y-2">
                <p className="font-semibold text-foreground">{course?.title}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {course?.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(course.date), "dd.MM.yyyy", { locale: de })}
                    </span>
                  )}

                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dein vollständiger Name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Anmerkungen (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Besondere Wünsche oder Hinweise..."
                    className="mt-1.5 h-20"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={handleClose}>
                  Abbrechen
                </Button>
                <Button onClick={handleBook} disabled={!name.trim()}>
                  Jetzt buchen
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {bookMutation.isPending && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground">Buchung wird verarbeitet...</p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Erfolgreich gebucht!</h3>
              <p className="text-muted-foreground max-w-sm">
                Dein Platz für <strong>{course?.title}</strong> ist reserviert.
                Du findest die Buchung unter „Meine Buchungen".
              </p>
              <Button onClick={handleClose} className="mt-2">
                Schließen
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}