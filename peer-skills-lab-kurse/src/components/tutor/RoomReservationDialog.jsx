import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function RoomReservationDialog({ open, onOpenChange, course }) {
  if (!course) return null;

  const emailSubject = `Raum reservieren für "${course.title}"`;
  const emailBody = `Guten Tag,

ich möchte einen Raum für meinen Kurs im Peer Skills Lab reservieren:

Kursinformationen:
- Kurs: ${course.title}
- Datum: ${format(new Date(course.date), "dd.MM.yyyy", { locale: de })}
- Uhrzeit: ${course.time || "Nach Absprache"}
- Ort: ${course.location || "Wird festgelegt"}
- Max. Teilnehmer: ${course.max_participants}

Bitte reserviert einen passenden Raum für die angegebene Zeit.

Vielen Dank!`;

  const mailtoLink = `mailto:studentbiss@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raum reservieren</DialogTitle>
          <DialogDescription>
            Kontaktiere studentbiss@gmail.com zur Raum-Reservierung
          </DialogDescription>
        </DialogHeader>

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Kursdetails:</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Kurs:</span> {course.title}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Datum:</span>{" "}
            {format(new Date(course.date), "dd.MM.yyyy", { locale: de })}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Uhrzeit:</span> {course.time || "Nach Absprache"}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Ort:</span> {course.location || "Wird festgelegt"}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Max. Teilnehmer:</span> {course.max_participants}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          <a href={mailtoLink}>
            <Button className="gap-2">
              <Mail className="w-4 h-4" />
              E-Mail verfassen
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}