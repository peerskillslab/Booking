// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { peerskillslab } from "@/api/peerskillslabClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { queryKeys } from "@/lib/queryKeys";
import { useCategories } from "@/lib/useCategories";

// Kursrechte einer Tutor:in: welche Kategorien sie ausschreiben darf.
// person: { id, name, categories }
export default function CategoryRightsDialog({ person, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { names } = useCategories();
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (person) {
      setSelected(new Set(person.categories || []));
      setFilter("");
    }
  }, [person]);

  const save = useMutation({
    mutationFn: () => peerskillslab.userCategories.set(person.id, [...selected]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
      toast({ title: "Kursrechte gespeichert", duration: 2000 });
      onClose();
    },
    onError: () => {
      toast({ title: "Kursrechte konnten nicht gespeichert werden", description: "Bitte versuche es später erneut.", variant: "destructive" });
    },
  });

  const visible = filter
    ? names.filter((n) => n.toLowerCase().includes(filter.toLowerCase()))
    : names;
  const toggle = (name, on) => {
    const next = new Set(selected);
    if (on) next.add(name); else next.delete(name);
    setSelected(next);
  };
  const countActive = names.filter((n) => selected.has(n)).length;

  return (
    <Dialog open={!!person} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kursrechte: {person?.name}</DialogTitle>
          <DialogDescription>
            Diese Kategorien darf die Person ausschreiben. {countActive} von {names.length} ausgewählt.
          </DialogDescription>
        </DialogHeader>

        {names.length > 8 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Kategorie suchen…" value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9" />
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm"
            onClick={() => setSelected(new Set([...selected, ...visible]))}>
            {filter ? "Treffer auswählen" : "Alle"}
          </Button>
          <Button type="button" variant="outline" size="sm"
            onClick={() => setSelected(new Set([...selected].filter((n) => !visible.includes(n))))}>
            {filter ? "Treffer abwählen" : "Keine"}
          </Button>
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
          {visible.map((name) => (
            <label key={name} className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm">
              <Checkbox checked={selected.has(name)} onCheckedChange={(v) => toggle(name, v === true)} />
              {name}
            </label>
          ))}
          {visible.length === 0 && <p className="text-sm text-muted-foreground py-3 text-center">Keine Kategorie gefunden</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
