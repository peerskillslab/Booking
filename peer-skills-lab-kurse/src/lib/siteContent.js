import { useQuery } from "@tanstack/react-query";
import { peerskillslab } from "@/api/peerskillslabClient";

export const siteContentKey = (key) => ["siteContent", key];

// Leere Vorlage mit derselben Struktur wie `template`: Strings werden zu "",
// Listen zu [] und Objekte feldweise. Fehlende Felder in gespeicherten
// Listeneinträgen werden damit leer statt mit Text eines anderen Eintrags gefüllt.
function blankOf(template) {
  if (typeof template === "string") return "";
  if (Array.isArray(template)) return [];
  if (template && typeof template === "object") {
    return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, blankOf(v)]));
  }
  return template;
}

// Legt gespeicherte Inhalte über die Standardtexte. Was nicht zur erwarteten
// Struktur passt (falscher Typ, fehlendes Feld), fällt auf den Standard zurück,
// damit eine kaputte oder alte Speicherung die Seite nie leer macht.
export function mergeContent(defaults, stored) {
  if (typeof defaults === "string") {
    return typeof stored === "string" ? stored : defaults;
  }
  if (Array.isArray(defaults)) {
    if (!Array.isArray(stored)) return defaults;
    const blank = blankOf(defaults[0]);
    return stored.map((item) => mergeContent(blank, item));
  }
  if (defaults && typeof defaults === "object") {
    const src = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
    return Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [k, mergeContent(v, src[k])])
    );
  }
  return defaults;
}

// Inhalt einer Infoseite: gespeicherte Werte aus der Datenbank, sonst Standardtexte.
// Beim Laden und bei Fehlern erscheinen sofort die Standardtexte.
export function useSiteContent(key, defaults) {
  const { data } = useQuery({
    queryKey: siteContentKey(key),
    queryFn: () => peerskillslab.content.get(key),
    staleTime: 60 * 1000,
  });
  return mergeContent(defaults, data?.value);
}
