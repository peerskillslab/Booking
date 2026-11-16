import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { peerskillslab } from "@/api/peerskillslabClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/lib/AuthContext";

// Aktive Kategorien aus der Datenbank (gepflegt unter Admin → Kategorien).
// names: Namen in Anzeigereihenfolge, byName: Vorgaben je Kategorie
// (Kurzbeschreibung, Beschreibung, Studienjahr) für neue Vorlagen.
export function useCategories() {
  const { data = [], isLoading } = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: () => peerskillslab.categories.list(),
    staleTime: 5 * 60 * 1000,
  });
  return useMemo(() => ({
    categories: data,
    names: data.map((c) => c.name),
    byName: Object.fromEntries(data.map((c) => [c.name, c])),
    isLoading,
  }), [data, isLoading]);
}

// Kategorien, die die angemeldete Person ausschreiben darf: Admins alle,
// Tutor:innen nur die ihnen zugeteilten (Kursrechte in der Nutzer:innenverwaltung).
// Der Server prüft dasselbe noch einmal, das hier steuert nur die Auswahl.
export function useAllowedCategories() {
  const { user } = useAuth();
  const all = useCategories();
  return useMemo(() => {
    const isAdmin = user?.role === "admin";
    const own = new Set(user?.categories || []);
    const names = isAdmin ? all.names : all.names.filter((n) => own.has(n));
    return { ...all, names, isAllowed: (name) => isAdmin || own.has(name) };
  }, [all, user]);
}
