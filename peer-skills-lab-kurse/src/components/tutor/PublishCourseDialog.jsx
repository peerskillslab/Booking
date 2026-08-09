import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateOnCoursePublish } from "@/lib/invalidationStrategy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import TimeInput from "@/components/ui/TimeInput";
import RoomReservationDialog from "./RoomReservationDialog";

export default function PublishCourseDialog({ open, onOpenChange, template, user, onPublished }) {
  const queryClient = useQueryClient();
  const sessionCount = template?.session_count || 1;
  const isMultiSession = sessionCount > 1;

  const [sessions, setSessions] = useState(
    Array(sessionCount).fill(null).map(() => ({ date: "", timeStart: "", timeEnd: "" }))
  );
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [showRoomReservation, setShowRoomReservation] = useState(false);
  const [createdCourse, setCreatedCourse] = useState(null);

  useEffect(() => {
    if (template) {
      setSessions(Array(template.session_count || 1).fill(null).map(() => ({ date: "", timeStart: "", timeEnd: "" })));
      setLocation(template.location || "");
      setMaxParticipants(template.max_participants || 10);
    }
    setDone(false);
    setError(null);
  }, [template, open]);

  const publishMutation = useMutation({
    mutationFn: () => {
      const primarySession = sessions[0];
      const extraDates = sessions.slice(1).map(s => ({
        date: s.date,
        time: s.timeStart && s.timeEnd ? `${s.timeStart} - ${s.timeEnd}` : s.timeStart || ""
      }));

      return peerskillslab.entities.Course.create({
        title: template.title,
        description: template.description,
        short_description: template.short_description,
        category: template.category,
        level: template.level,
        duration_minutes: template.duration_minutes,
        image_url: template.image_url,
        instructor: user?.full_name || user?.email || "",
        date: primarySession.date,
        time: primarySession.timeStart && primarySession.timeEnd ? `${primarySession.timeStart} - ${primarySession.timeEnd}` : primarySession.timeStart || "",
        location,
        max_participants: Number(maxParticipants),
        current_participants: 0,
        status: "active",
        extra_dates: extraDates.length > 0 ? JSON.stringify(extraDates) : null,
      });
    },
    onSuccess: (course) => {
      setCreatedCourse(course);
      setDone(true);
      // Use granular invalidation instead of carpet-bombing
      invalidateOnCoursePublish(queryClient);
      onPublished();
      setError(null);
    },
    onError: (err) => {
      setError(err?.message || "Fehler beim Ausschreiben des Kurses");
    },
  });

  const updateSession = (index, field, value) => {
    setSessions(s => {
      const newSessions = [...s];
      newSessions[index] = { ...newSessions[index], [field]: value };
      return newSessions;
    });
  };

  const allSessionsValid = sessions.every(s =>
    s.date && (s.timeStart?.toString().trim()) && (s.timeEnd?.toString().trim())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMultiSession ? "sm:max-w-2xl max-h-[90vh] overflow-y-auto" : "sm:max-w-md"}>
        {done ? (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Kurs ausgeschrieben!</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              „{template?.title}" ist jetzt aktiv und buchbar{isMultiSession && ` (${sessionCount} Termine)`}.
            </p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Schließen
              </Button>
              <Button
                onClick={() => setShowRoomReservation(true)}
                className="flex-1"
              >
                Raum reservieren
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Kurs ausschreiben</DialogTitle>
              <DialogDescription>
                Basierend auf der Vorlage <strong>{template?.title}</strong>
                {isMultiSession && ` (${sessionCount} Termine)`}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="grid gap-6 py-4">
              {isMultiSession ? (
                <div className="space-y-4">
                  {sessions.map((session, i) => (
                    <div key={i} className="p-4 bg-muted/30 rounded-lg border border-border/60">
                      <h4 className="text-sm font-semibold mb-3">Termin {i + 1}</h4>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Datum *</Label>
                          <Input type="date" value={session.date} onChange={(e) => updateSession(i, "date", e.target.value)} className="mt-1 h-9" />
                        </div>
                        <div>
                          <Label className="text-xs">Von *</Label>
                          <TimeInput value={session.timeStart} onChange={(v) => updateSession(i, "timeStart", v)} className="mt-1 h-9" />
                        </div>
                        <div>
                          <Label className="text-xs">Bis *</Label>
                          <TimeInput value={session.timeEnd} onChange={(v) => updateSession(i, "timeEnd", v)} className="mt-1 h-9" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Datum *</Label>
                    <Input type="date" value={sessions[0].date} onChange={(e) => updateSession(0, "date", e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Uhrzeit von *</Label>
                    <TimeInput value={sessions[0].timeStart} onChange={(v) => updateSession(0, "timeStart", v)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Uhrzeit bis *</Label>
                    <TimeInput value={sessions[0].timeEnd} onChange={(v) => updateSession(0, "timeEnd", v)} className="mt-1.5" />
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Ort</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Max. Teilnehmer</Label>
                  <Input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className="mt-1.5" />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2">
              {!allSessionsValid && (
                <p className="text-xs text-muted-foreground text-center">
                  Bitte füllen Sie alle Felder aus
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Abbrechen</Button>
                <Button
                  onClick={() => publishMutation.mutate()}
                  disabled={!allSessionsValid || publishMutation.isPending}
                  className="flex-1"
                >
                  {publishMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Ausschreiben
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {createdCourse && (
        <RoomReservationDialog
          open={showRoomReservation}
          onOpenChange={setShowRoomReservation}
          course={createdCourse}
        />
      )}
    </Dialog>
  );
}
