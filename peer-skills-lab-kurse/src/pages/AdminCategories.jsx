// @ts-nocheck
import React, { useState } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Tag, Plus, Pencil, Trash2, ArrowUp, ArrowDown, EyeOff, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRequireAuth, isAdminUser } from "@/lib/useRequireAuth";
import { queryKeys } from "@/lib/queryKeys";
import { LEVELS } from "@/lib/courseConstants";
import { CategoryBadge } from "@/components/courses/CategoryBadge";

const EMPTY = { name: "", short_description: "", description: "", level: "Alle Studienjahre" };

const ERROR_TEXT = {
  name_taken: "Diesen Namen gibt es schon.",
  invalid_name: "Bitte einen Namen mit höchstens 60 Zeichen eingeben.",
  category_in_use: "Die Kategorie wird von Kursen verwendet. Deaktiviere sie stattdessen.",
};
const errorText = (err) => ERROR_TEXT[err?.data?.error] || "Bitte versuche es später erneut.";

export default function AdminCategories() {
  const { user } = useRequireAuth(isAdminUser);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // { original: name|null, form }
  const [pendingDelete, setPendingDelete] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: queryKeys.adminCategories(),
    queryFn: () => peerskillslab.categories.listAll(),
    enabled: user?.role === "admin",
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories() });
    queryClient.invalidateQueries({ queryKey: queryKeys.categories() });
    // Umbenennen ändert Kurse, Vorlagen und Kursrechte mit
    queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    queryClient.invalidateQueries({ queryKey: queryKeys.courseTemplates() });
    queryClient.invalidateQueries({ queryKey: queryKeys.courses() });
  };
  const fail = (title) => (err) => toast({ title, description: errorText(err), variant: "destructive", duration: 4000 });

  const save = useMutation({
    mutationFn: ({ original, form }) => original
      ? peerskillslab.categories.update(original, form)
      : peerskillslab.categories.create(form),
    onSuccess: (_d, { original }) => {
      refresh();
      setEditing(null);
      toast({ title: original ? "Kategorie gespeichert" : "Kategorie angelegt", duration: 2000 });
    },
    onError: fail("Speichern fehlgeschlagen"),
  });

  const toggleActive = useMutation({
    mutationFn: (c) => peerskillslab.categories.update(c.name, { active: !c.active }),
    onSuccess: (_d, c) => { refresh(); toast({ title: c.active ? "Kategorie deaktiviert" : "Kategorie aktiviert", duration: 2000 }); },
    onError: fail("Ändern fehlgeschlagen"),
  });

  const remove = useMutation({
    mutationFn: (name) => peerskillslab.categories.remove(name),
    onSuccess: () => { refresh(); setPendingDelete(null); toast({ title: "Kategorie gelöscht", duration: 2000 }); },
    onError: (err) => { setPendingDelete(null); fail("Löschen fehlgeschlagen")(err); },
  });

  // Reihenfolge: Liste neu durchnummerieren und nur geänderte Einträge speichern
  const reorder = useMutation({
    mutationFn: async ({ from, to }) => {
      const list = categories.slice();
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      for (const [i, c] of list.entries()) {
        if (c.sort_order !== i) await peerskillslab.categories.update(c.name, { sort_order: i });
      }
    },
    onSuccess: refresh,
    onError: fail("Verschieben fehlgeschlagen"),
  });

  if (user?.role !== "admin") return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
  );

  const f = (key, value) => setEditing((e) => ({ ...e, form: { ...e.form, [key]: value } }));
  const busy = reorder.isPending || toggleActive.isPending;

  return (
    <div className="psl-page">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Kategorien</h1>
            <p className="text-muted-foreground mt-0.5">
              Kursarten, aus denen Kurse ausgeschrieben werden. Wer welche ausschreiben darf, legst du unter «Nutzer:innen» fest.
            </p>
          </div>
        </div>
        <Button onClick={() => setEditing({ original: null, form: EMPTY })}>
          <Plus className="w-4 h-4 mr-1.5" /> Neue Kategorie
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {categories.map((c, i) => (
            <Card key={c.name} className={`border-border/60 ${c.active ? "" : "opacity-60"}`}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge category={c.name} className="text-xs border" />
                    {!c.active && <span className="text-xs text-muted-foreground">deaktiviert</span>}
                  </div>
                  {c.short_description && <p className="text-sm text-muted-foreground mt-1.5 truncate">{c.short_description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.course_count} {c.course_count === 1 ? "Kurs" : "Kurse"} · {c.tutor_count} {c.tutor_count === 1 ? "Tutor:in" : "Tutor:innen"} mit Kursrecht
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Nach oben" title="Nach oben"
                    disabled={i === 0 || busy} onClick={() => reorder.mutate({ from: i, to: i - 1 })}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Nach unten" title="Nach unten"
                    disabled={i === categories.length - 1 || busy} onClick={() => reorder.mutate({ from: i, to: i + 1 })}>
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Bearbeiten" aria-label="Bearbeiten"
                    onClick={() => setEditing({
                      original: c.name,
                      form: { name: c.name, short_description: c.short_description || "", description: c.description || "", level: c.level || "Alle Studienjahre" },
                    })}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={busy}
                    title={c.active ? "Deaktivieren (nicht mehr wählbar, bestehende Kurse bleiben)" : "Aktivieren"}
                    aria-label={c.active ? "Deaktivieren" : "Aktivieren"}
                    onClick={() => toggleActive.mutate(c)}>
                    {c.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive disabled:opacity-30"
                    disabled={c.course_count > 0}
                    title={c.course_count > 0 ? "Wird von Kursen verwendet – stattdessen deaktivieren" : "Löschen"}
                    aria-label="Löschen"
                    onClick={() => setPendingDelete(c.name)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.original ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
            <DialogDescription>
              Kurzbeschreibung, Beschreibung und Studienjahr sind die Vorgaben für neue Kursvorlagen dieser Kategorie.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={editing.form.name} maxLength={60} onChange={(e) => f("name", e.target.value)} className="mt-1.5" />
                {editing.original && editing.form.name.trim() !== editing.original && (
                  <p className="text-xs text-muted-foreground mt-1">Bestehende Kurse, Vorlagen und Kursrechte werden mit umbenannt.</p>
                )}
              </div>
              <div>
                <Label>Kurzbeschreibung</Label>
                <Input value={editing.form.short_description} onChange={(e) => f("short_description", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea value={editing.form.description} onChange={(e) => f("description", e.target.value)} className="mt-1.5 h-28" />
              </div>
              <div>
                <Label>Studienjahr</Label>
                <Select value={editing.form.level} onValueChange={(v) => f("level", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Abbrechen</Button>
            <Button disabled={!editing?.form.name.trim() || save.isPending}
              onClick={() => save.mutate({ original: editing.original, form: { ...editing.form, name: editing.form.name.trim() } })}>
              {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDelete}» wird gelöscht, zusammen mit den Kursrechten dafür.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate(pendingDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
