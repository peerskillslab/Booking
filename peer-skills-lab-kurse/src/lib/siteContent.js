import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { peerskillslab } from "@/api/peerskillslabClient";

export const siteContentKey = (key) => ["siteContent", key];

// Eintrag einer gespeicherten Liste gegen die Struktur des ersten Standard-Eintrags
// prüfen. Fehlende Felder werden leer statt mit Text eines anderen Eintrags gefüllt;
// verschachtelte Listen (z. B. FAQ: Kategorie → Fragen) behalten ihre Struktur.
function mergeItem(template, stored) {
  if (typeof template === "string") return typeof stored === "string" ? stored : "";
  if (Array.isArray(template)) {
    return Array.isArray(stored) ? stored.map((s) => mergeItem(template[0], s)) : [];
  }
  if (template && typeof template === "object") {
    const src = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
    return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, mergeItem(v, src[k])]));
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
    return stored.map((item) => mergeItem(defaults[0], item));
  }
  if (defaults && typeof defaults === "object") {
    const src = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
    return Object.fromEntries(
      Object.entries(defaults).map(([k, v]) => [k, mergeContent(v, src[k])])
    );
  }
  return defaults;
}

// Vorschau im Admin-Bereich: Die Seite läuft dann im iframe mit ?preview=1 und
// bekommt den Entwurf per postMessage (nur vom selben Origin).
const IS_PREVIEW =
  typeof window !== "undefined" &&
  window.parent !== window &&
  new URLSearchParams(window.location.search).get("preview") === "1";

// Inhalt einer Infoseite: gespeicherte Werte aus der Datenbank, sonst Standardtexte.
// Beim Laden und bei Fehlern erscheinen sofort die Standardtexte.
export function useSiteContent(key, defaults) {
  const { data } = useQuery({
    queryKey: siteContentKey(key),
    queryFn: () => peerskillslab.content.get(key),
    staleTime: 60 * 1000,
  });
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!IS_PREVIEW) return;
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || !e.data) return;
      if (e.data.type === "psl-content-preview" && e.data.key === key) {
        setDraft(e.data.value);
      } else if (e.data.type === "psl-scroll" && typeof e.data.anchor === "string") {
        document.getElementById(e.data.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "psl-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [key]);

  return mergeContent(defaults, IS_PREVIEW && draft ? draft : data?.value);
}
