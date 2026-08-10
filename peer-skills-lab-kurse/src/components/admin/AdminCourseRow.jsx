import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2, Users, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { CategoryBadge, StatusBadge } from "@/components/courses/CategoryBadge";
import { formatCourseDate } from "@/lib/courseUtils";

/**
 * One course row in AdminCourses. Previously this markup existed twice
 * (upcoming/past) and had already drifted apart between the two copies.
 */
export default function AdminCourseRow({
  course, index, onShowParticipants, onEdit, onDelete,
  deleteError, onResetDeleteError, isDeleting,
}) {
  const participants = course.current_participants || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="border-border/60">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {course.kurs_nr && (
                <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                  K-{String(course.kurs_nr).padStart(3, "0")}
                </span>
              )}
              <span className="font-semibold truncate">{course.title}</span>
              <CategoryBadge category={course.category} />
              <StatusBadge status={course.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span>{formatCourseDate(course.date)}</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {participants}/{course.max_participants}
              </span>
              {course.instructor && <span>Tutor: {course.instructor}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => onShowParticipants(course)}
              style={{ height: 32, borderRadius: 9 }}
            >
              <Eye className="w-3.5 h-3.5 mr-1" /> Teilnehmende
            </Button>
            <Button
              variant="outline"
              onClick={() => onEdit(course)}
              style={{ height: 32, borderRadius: 9 }}
            >
              <Pencil className="w-3.5 h-3.5 mr-1" /> Bearbeiten
            </Button>
            <AlertDialog onOpenChange={(open) => !open && onResetDeleteError()}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label={`Kurs „${course.title}" löschen`}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  style={{ height: 32, borderRadius: 9 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kurs löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    „{course.title}" wird unwiderruflich gelöscht.
                    {participants > 0 && (
                      <span className="block mt-2 text-sm font-semibold text-destructive">
                        Es gibt {participants} Anmeldung{participants !== 1 ? "en" : ""}. Nach dem
                        Löschen wird deine Mail-App mit allen Teilnehmenden geöffnet.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError && (
                  <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                    {deleteError}
                  </div>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={onResetDeleteError}>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onResetDeleteError();
                      onDelete(course.id);
                    }}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
