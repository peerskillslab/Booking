import React, { useState, useEffect } from 'react';
import { peerskillslab } from '@/api/peerskillslabClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { invalidateOnAttendanceChange } from '@/lib/invalidationStrategy';

export default function AttendanceDialog({ open, onOpenChange, course }) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!open || !course) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const allBookings = await peerskillslab.entities.Booking.filter({ course_id: course.id });
        if (cancelled) return;
        const confirmed = allBookings.filter(b => b.status === 'confirmed');
        setBookings(confirmed);

        const attendanceMap = {};
        confirmed.forEach(b => {
          attendanceMap[b.id] = b.attended || false;
        });
        setAttendance(attendanceMap);
      } catch {
        if (cancelled) return;
        setLoadError('Teilnehmende konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Schnelles Schliessen und Wiederöffnen darf keine veraltete Antwort
    // über den frischen State schreiben.
    return () => { cancelled = true; };
  }, [open, course]);

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      await Promise.all(
        updates.map(({ id, attended }) =>
          peerskillslab.entities.Booking.update(id, { attended })
        )
      );
    },
    onSuccess: () => {
      // Ohne die E-Mail entstehen Keys wie ["myStats", undefined], die auf
      // nichts passen — die Invalidierung lief bisher ins Leere.
      queryClient.invalidateQueries({ queryKey: queryKeys.tutorCourses(user?.email) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courseBookings(course?.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courseParticipants(course?.id) });
      invalidateOnAttendanceChange(queryClient, user?.email);
      toast({
        title: "Anwesenheit gespeichert",
        duration: 2000
      });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({
        title: "Fehler beim Speichern",
        description: err.data?.error || "Bitte versuche es später erneut.",
        variant: "destructive",
        duration: 3000
      });
    },
  });

  const handleSave = () => {
    const updates = bookings
      .map(b => ({ id: b.id, attended: attendance[b.id] || false }))
      .filter(u => u.attended !== bookings.find(b => b.id === u.id)?.attended);

    if (updates.length > 0) {
      updateMutation.mutate(updates);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Anwesenheiten bestätigen</DialogTitle>
          <DialogDescription>{course?.title}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive text-center py-4">{loadError}</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Keine bestätigten Buchungen</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bookings.map(booking => (
              <div key={booking.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                <Checkbox
                  id={booking.id}
                  checked={attendance[booking.id] || false}
                  onCheckedChange={(checked) => {
                    setAttendance(prev => ({
                      ...prev,
                      [booking.id]: checked
                    }));
                  }}
                />
                <label htmlFor={booking.id} className="flex-1 cursor-pointer text-sm font-medium">
                  {booking.user_name || booking.user_email}
                </label>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={loading || updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
