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
import { apiErrorMessage } from "@/lib/errorMessages";

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
        instructor_email: user?.email || "",
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
      setError(apiErrorMessage(err, "Fehler beim Ausschreiben des Kurses."));
    },
  });

  // «bis» aus der Kursdauer der Vorlage vorschlagen, solange es nicht von Hand gesetzt wurde
  const addMinutes = (hhmm, minutes) => {
    const [h, m] = hhmm.split(":").map(Number);
    const total = h * 60 + m + minutes;
    if (!minutes || total >= 24 * 60) return "";
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  const updateSession = (index, field, value) => {
    setSessions(s => {
      const newSessions = [...s];
      const current = { ...newSessions[index], [field]: value };
      if (field === "timeEnd") current.endAuto = false;
      if (field === "timeStart" && value && (!current.timeEnd || current.endAuto)) {
        const suggested = addMinutes(value, Number(template?.duration_minutes) || 0);
        if (suggested) { current.timeEnd = suggested; current.endAuto = true; }
      }
      newSessions[index] = current;
      return newSessions;
    });
  };

  // Konkret benennen, was noch fehlt – vorher stand nur «alle Felder», und bei
  // Vorlagen mit mehreren Terminen war unklar, welches Feld den Knopf sperrt.
  const problems = sessions.flatMap((s, i) => {
    const prefix = isMultiSession ? `Termin ${i + 1}: ` : "";
    const missing = [
      !s.date && "Datum",
      !s.timeStart && "Uhrzeit von",
      !s.timeEnd && "Uhrzeit bis",
    ].filter(Boolean);
    if (missing.length) {
      const hint = missing.some((x) => x.startsWith("Uhrzeit")) ? " (Uhrzeit z. B. 18:15)" : "";
      return [`${prefix}${missing.join(", ")} fehlt${hint}`];
    }
    if (s.timeEnd <= s.timeStart) return [`${prefix}«bis» muss nach «von» liegen`];
    return [];
  });
  const allSessionsValid = problems.length === 0;

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
                <div className="text-xs text-muted-foreground text-center">
                  {problems.map((p) => <div key={p}>{p}</div>)}
                </div>
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
