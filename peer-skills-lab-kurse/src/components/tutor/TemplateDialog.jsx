import React, { useState, useEffect } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const CATEGORIES = ["CST Abdomen", "CST HKL", "CST Gynäkologie", "CST Lunge", "CST Neurologie", "CST Bewegungsapparat", "POCUS", "Venenpunktion", "YSSA"];
const LEVELS = ["Anfänger", "Fortgeschritten", "Experte", "Alle Level"];

const empty = {
  title: "", short_description: "", description: "", category: "CST Abdomen",
  level: "Alle Level", duration_minutes: 60, max_participants: 10,
  location: "", image_url: "", session_count: 1,
};

export default function TemplateDialog({ open, onOpenChange, editingTemplate, onSaved }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editingTemplate) {
      setForm({
        title: editingTemplate.title || "",
        short_description: editingTemplate.short_description || "",
        description: editingTemplate.description || "",
        category: editingTemplate.category || "CST Abdomen",
        level: editingTemplate.level || "Alle Level",
        duration_minutes: editingTemplate.duration_minutes || 60,
        max_participants: editingTemplate.max_participants || 10,
        location: editingTemplate.location || "",
        image_url: editingTemplate.image_url || "",
        session_count: editingTemplate.session_count || 1,
      });
    } else {
      setForm(empty);
    }
  }, [editingTemplate, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingTemplate) {
        await peerskillslab.entities.CourseTemplate.update(editingTemplate.id, data);
      } else {
        await peerskillslab.entities.CourseTemplate.create(data);
      }
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
  });

  const f = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? "Vorlage bearbeiten" : "Neue Kursvorlage"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Titel *</Label>
              <Input value={form.title} onChange={(e) => f("title", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Kategorie *</Label>
              <Select value={form.category} onValueChange={(v) => f("category", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Kurzbeschreibung</Label>
            <Input value={form.short_description} onChange={(e) => f("short_description", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea value={form.description} onChange={(e) => f("description", e.target.value)} className="mt-1.5 h-24" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => f("level", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dauer (Min.)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => f("duration_minutes", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label>Max. Teilnehmer</Label>
              <Input type="number" value={form.max_participants} onChange={(e) => f("max_participants", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Standardort</Label>
              <Input value={form.location} onChange={(e) => f("location", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Anzahl Termine</Label>
              <Select value={String(form.session_count)} onValueChange={(v) => f("session_count", parseInt(v))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {[1, 2, 3, 4, 5, 6].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Bild-URL</Label>
            <Input value={form.image_url} onChange={(e) => f("image_url", e.target.value)} placeholder="https://..." className="mt-1.5" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button onClick={() => saveMutation.mutate({ ...form, max_participants: Number(form.max_participants), duration_minutes: Number(form.duration_minutes) })} disabled={!form.title || saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editingTemplate ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}