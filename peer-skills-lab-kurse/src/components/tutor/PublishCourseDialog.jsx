import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import TimeInput from "@/components/ui/TimeInput";
import RoomReservationDialog from "./RoomReservationDialog";

export default function PublishCourseDialog({ open, onOpenChange, template, user, onPublished }) {
  const [form, setForm] = useState({ date: "", timeStart: "", timeEnd: "", location: "", max_participants: 10 });
  const [done, setDone] = useState(false);
  const [showRoomReservation, setShowRoomReservation] = useState(false);
  const [createdCourse, setCreatedCourse] = useState(null);

  useEffect(() => {
    if (template) {
      setForm({
        date: "",
        timeStart: "",
        timeEnd: "",
        location: template.location || "",
        max_participants: template.max_participants || 10,
      });
    }
    setDone(false);
  }, [template, open]);

  const publishMutation = useMutation({
    mutationFn: () =>
      peerskillslab.entities.Course.create({
        title: template.title,
        description: template.description,
        short_description: template.short_description,
        category: template.category,
        level: template.level,
        duration_minutes: template.duration_minutes,
        image_url: template.image_url,
        instructor: user?.full_name || user?.email || "",
        date: form.date,
        time: form.timeStart && form.timeEnd ? `${form.timeStart} - ${form.timeEnd}` : form.timeStart || "",
        location: form.location,
        max_participants: Number(form.max_participants),
        current_participants: 0,
        status: "active",
      }),
    onSuccess: (course) => {
      setCreatedCourse(course);
      setDone(true);
      onPublished();
    },
  });

  const f = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Kurs ausgeschrieben!</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              „{template?.title}" ist jetzt aktiv und buchbar.
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
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Datum *</Label>
                  <Input type="date" value={form.date} onChange={(e) => f("date", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                   <Label>Uhrzeit von *</Label>
                   <TimeInput value={form.timeStart} onChange={(v) => f("timeStart", v)} className="mt-1.5" />
                 </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                   <Label>Uhrzeit bis *</Label>
                   <TimeInput value={form.timeEnd} onChange={(v) => f("timeEnd", v)} className="mt-1.5" />
                 </div>
              </div>
              <div>
                <Label>Ort</Label>
                <Input value={form.location} onChange={(e) => f("location", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Max. Teilnehmer</Label>
                <Input type="number" value={form.max_participants} onChange={(e) => f("max_participants", e.target.value)} className="mt-1.5" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
              <Button
                 onClick={() => publishMutation.mutate()}
                 disabled={!form.date || !form.timeStart || !form.timeEnd || publishMutation.isPending}
               >
                {publishMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ausschreiben
              </Button>
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