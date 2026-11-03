// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from "react";
import { peerskillslab } from "@/api/peerskillslabClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, FileText, ArrowUp, ArrowDown, Trash2, Plus, ExternalLink, ChevronDown } from "lucide-react";
import ContentPreview from "@/components/admin/ContentPreview";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { siteContentKey, mergeContent } from "@/lib/siteContent";
import { TUTOR_WERDEN_DEFAULTS, FAQ_DEFAULTS, ABOUT_DEFAULTS } from "@/content/defaults";

// Beschreibt, welche Felder pro Seite bearbeitbar sind. Die Struktur muss zu
// src/content/defaults.js passen; der Server prüft nur Typ und Länge.
const PAGES = [
  {
    key: "about",
    label: "Startseite (Über uns)",
    path: "/AboutUs",
    defaults: ABOUT_DEFAULTS,
    fields: [
      { type: "heading", label: "Startbereich", anchor: "hero" },
      { key: "heroKicker", label: "Kleine Zeile über dem Titel" },
      { key: "heroTitle1", label: "Titel, erste Zeile" },
      { key: "heroTitle2", label: "Titel, zweite Zeile (grün)" },
      { key: "faqButton", label: "Beschriftung des FAQ-Knopfs" },
      { key: "heroBrand", label: "Name (fett gedruckt)" },
      { key: "heroIntro", label: "Einleitungstext (folgt direkt nach dem Namen)", multiline: true },
      {
        key: "pills", label: "Stichwörter neben dem Einleitungstext", type: "list", itemLabel: "Stichwort",
        hint: "Die Symbole davor ergeben sich aus der Reihenfolge.",
        fields: [{ key: "label", label: "Stichwort" }],
      },
      { type: "heading", label: "Fotos unter dem Startbereich", anchor: "images" },
      {
        key: "images", label: "Beschriftungen", type: "list", itemLabel: "Foto", fixed: true,
        hint: "Die drei Fotos selbst bleiben fest, hier ändern sich nur die Beschriftungen.",
        fields: [
          { key: "label", label: "Titel" },
          { key: "caption", label: "Untertitel" },
        ],
      },
      { type: "heading", label: "Vier Prinzipien", anchor: "how" },
      { key: "howKicker", label: "Kleine Zeile" },
      { key: "howTitle", label: "Überschrift", multiline: true, hint: "Enter erzeugt eine neue Zeile." },
      {
        key: "steps", label: "Prinzipien", type: "list", itemLabel: "Prinzip",
        fields: [
          { key: "title", label: "Titel" },
          { key: "body", label: "Text", multiline: true },
        ],
      },
      { type: "heading", label: "In Zahlen", anchor: "stats" },
      { key: "statsKicker", label: "Kleine Zeile" },
      { key: "statsTitle", label: "Überschrift" },
      {
        key: "stats", label: "Zahlen", type: "list", itemLabel: "Zahl",
        fields: [
          { key: "n", label: "Zahl" },
          { key: "label", label: "Beschriftung" },
          { key: "sub", label: "Zusatz" },
        ],
      },
      { type: "heading", label: "Kurse", anchor: "courses" },
      { key: "coursesTitle", label: "Überschrift" },
      { key: "coursesIntro", label: "Einleitung", multiline: true },
      {
        key: "courses", label: "Kurse", type: "list", itemLabel: "Kurs",
        hint: "Die Zahl «n Kurse» über der Liste zählt sich selbst.",
        fields: [
          { key: "name", label: "Name" },
          { key: "body", label: "Beschreibung", multiline: true },
        ],
      },
      { type: "heading", label: "Team", anchor: "team" },
      { key: "teamKicker", label: "Kleine Zeile" },
      { key: "teamTitle", label: "Überschrift", multiline: true, hint: "Enter erzeugt eine neue Zeile." },
      { key: "teamText", label: "Text zum Mitmachen", multiline: true },
      {
        key: "team", label: "Teammitglieder", type: "list", itemLabel: "Person",
        hint: "Die Fotos hinterlegt das Entwicklungsteam. Neue Personen erscheinen zunächst ohne Foto, bestehende behalten ihres.",
        fields: [
          { key: "name", label: "Name" },
          { key: "role", label: "Rolle" },
        ],
      },
      { type: "heading", label: "Partner", anchor: "partners" },
      { key: "partnersTitle", label: "Überschrift" },
      { key: "partnersIntro", label: "Text", multiline: true },
      {
        key: "partners", label: "Partner", type: "list", itemLabel: "Partner",
        hint: "Die Logos hinterlegt das Entwicklungsteam. Die Zahl «n Institutionen» zählt sich selbst.",
        fields: [
          { key: "name", label: "Name" },
          { key: "url", label: "Web-Adresse" },
        ],
      },
      { type: "heading", label: "Kontakt", anchor: "contact" },
      { key: "contactTitle", label: "Überschrift" },
      {
        key: "contacts", label: "Kontaktwege", type: "list", itemLabel: "Kontaktweg",
        fields: [
          { key: "label", label: "Bezeichnung" },
          { key: "value", label: "Angezeigter Text" },
          { key: "href", label: "Link (z. B. mailto:… oder https://…)" },
        ],
      },
      { key: "contactNote", label: "Hinweis unter den Kontaktwegen" },
    ],
  },
  {
    key: "tutorwerden",
    label: "Tutor:in werden",
    path: "/TutorWerden",
    defaults: TUTOR_WERDEN_DEFAULTS,
    fields: [
      { type: "heading", label: "Einleitung", anchor: "intro" },
      { key: "intro", label: "Einleitung", multiline: true },
      { type: "heading", label: "Voraussetzungen", anchor: "requirements" },
      {
        key: "requirements", label: "Voraussetzungen", type: "list", itemLabel: "Voraussetzung",
        fields: [
          { key: "title", label: "Titel" },
          { key: "body", label: "Text", multiline: true },
        ],
      },
      { type: "heading", label: "Ablauf der Bewerbung", anchor: "timeline" },
      {
        key: "timeline", label: "Ablauf der Bewerbung", type: "list", itemLabel: "Schritt",
        fields: [
          { key: "month", label: "Zeitraum" },
          { key: "title", label: "Titel" },
          { key: "body", label: "Text", multiline: true },
        ],
      },
      { type: "heading", label: "Hinweis zur Anzahl Plätze", anchor: "seats" },
      { key: "seatsTitle", label: "Hinweis zur Anzahl Plätze: Titel" },
      { key: "seatsBody", label: "Hinweis zur Anzahl Plätze: Text", multiline: true },
      { type: "heading", label: "Kontaktkasten", anchor: "contact" },
      { key: "contactTitle", label: "Kontaktkasten: Titel" },
      { key: "contactBody", label: "Kontaktkasten: Text", multiline: true },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    path: "/FAQ",
    defaults: FAQ_DEFAULTS,
    fields: [
      { type: "heading", label: "Einleitung", anchor: "intro" },
      { key: "intro", label: "Einleitung", multiline: true },
      { type: "heading", label: "Fragen und Antworten" },
      {
        key: "sections", label: "Kategorien", type: "list", itemLabel: "Kategorie",
        fields: [
          { key: "category", label: "Name der Kategorie" },
          {
            key: "items", label: "Fragen", type: "list", itemLabel: "Frage",
            fields: [
              { key: "q", label: "Frage" },
              { key: "a", label: "Antwort", multiline: true },
            ],
          },
        ],
      },
    ],
  },
];

// Teilt die Feldliste an den Überschriften in Abschnitte
function groupSections(fields) {
  const out = [];
  for (const f of fields) {
    if (f.type === "heading") out.push({ title: f.label, anchor: f.anchor, fields: [] });
    else {
      if (!out.length) out.push({ title: "", fields: [] });
      out[out.length - 1].fields.push(f);
    }
  }
  return out;
}

function Section({ section, open, onToggle, children }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-left">
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
        <span className="text-base font-semibold text-foreground">{section.title}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

// Leerer Eintrag passend zu einer Feldbeschreibung
function blankItem(fields) {
  return Object.fromEntries(
    fields.filter((f) => f.type !== "heading").map((f) => [f.key, f.type === "list" ? [] : ""])
  );
}

function move(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Kurzbezeichnung eines Listeneintrags für die Kopfzeile (erstes ausgefülltes Textfeld)
function itemSummary(field, item) {
  for (const f of field.fields) {
    if (f.type !== "list" && typeof item[f.key] === "string" && item[f.key].trim()) {
      return item[f.key].replace(/\s+/g, " ").slice(0, 70);
    }
  }
  return "";
}

function ListItem({ field, item, index, count, depth, onMove, onRemove, onChangeItem, startOpen }) {
  const [open, setOpen] = useState(startOpen);
  const summary = itemSummary(field, item);
  return (
    <Card className="border-border/60" style={depth > 0 ? { background: "var(--psl-fill, transparent)" } : undefined}>
      <div className="flex items-center gap-1 pr-2">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-2 text-left px-4 py-2.5">
          <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
            {field.itemLabel} {index + 1}
          </span>
          {!open && summary && <span className="text-sm text-foreground truncate">{summary}</span>}
        </button>
        {!field.fixed && <div className="flex gap-1 shrink-0">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Nach oben"
            disabled={index === 0} onClick={() => onMove(index - 1)}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Nach unten"
            disabled={index === count - 1} onClick={() => onMove(index + 1)}>
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Löschen"
            onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>}
      </div>
      {open && (
        <CardContent className="px-4 pb-4 pt-0 space-y-3">
          {field.fields.map((sub) => (
            <Field key={sub.key} field={sub} value={item[sub.key]} depth={depth + 1}
              onChange={(v) => onChangeItem(sub.key, v)} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function Field({ field, value, onChange, depth }) {
  if (field.type === "heading") return null;
  if (field.type === "list") {
    const items = Array.isArray(value) ? value : [];
    // Einträge, die beim Öffnen schon da waren, starten zugeklappt; neue offen
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const initialCount = useRef(items.length);
    return (
      <div>
        <div className="text-sm font-semibold text-foreground mb-1">{field.label}</div>
        {field.hint && <p className="text-xs text-muted-foreground mb-2">{field.hint}</p>}
        <div className="space-y-3 mt-2">
          {items.map((item, i) => (
            <ListItem key={i} field={field} item={item} index={i} count={items.length} depth={depth}
              onMove={(to) => onChange(move(items, i, to))}
              onRemove={() => onChange(items.filter((_, j) => j !== i))}
              onChangeItem={(sub, v) => onChange(items.map((it, j) => (j === i ? { ...it, [sub]: v } : it)))}
              startOpen={i >= initialCount.current} />
          ))}
        </div>
        {!field.fixed && (
          <Button type="button" variant="outline" size="sm" className="mt-3"
            onClick={() => onChange([...items, blankItem(field.fields)])}>
            <Plus /> {field.itemLabel} hinzufügen
          </Button>
        )}
      </div>
    );
  }

  const Control = field.multiline ? Textarea : Input;
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1">{field.label}</span>
      {field.hint && <span className="block text-xs text-muted-foreground mb-1">{field.hint}</span>}
      <Control
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        {...(field.multiline ? { rows: 3 } : {})}
      />
    </label>
  );
}

export default function AdminContent() {
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();
  // Admin-Rolle allein reicht nicht: Es braucht die Zusatzberechtigung «Inhalte bearbeiten».
  const isAdmin = user?.role === "admin" && !!user?.can_edit_content;
  const queryClient = useQueryClient();
  const [pageKey, setPageKey] = useState(PAGES[0].key);
  const [draft, setDraft] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [openSection, setOpenSection] = useState(0);
  const [anchor, setAnchor] = useState(null);
  const [mobileView, setMobileView] = useState("edit");

  const page = PAGES.find((p) => p.key === pageKey);
  const sections = useMemo(() => groupSections(page.fields), [page]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      peerskillslab.auth.redirectToLogin(window.location.href);
    } else if (user.role !== "admin" || !user.can_edit_content) {
      window.location.href = "/";
    }
  }, [user, isLoadingAuth]);

  const { data, isLoading } = useQuery({
    queryKey: siteContentKey(pageKey),
    queryFn: () => peerskillslab.content.get(pageKey),
    enabled: isAdmin,
    staleTime: 0,
  });

  // Gespeicherter Stand der gewählten Seite (Standardtexte, solange nichts gespeichert ist)
  const saved = useMemo(
    () => (data ? mergeContent(page.defaults, data.value) : null),
    [data, page]
  );

  // Beim Seitenwechsel oder nach dem Speichern den Entwurf neu aufsetzen
  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  const dirty = draft && saved && JSON.stringify(draft) !== JSON.stringify(saved);

  const onSaved = (title) => {
    queryClient.invalidateQueries({ queryKey: siteContentKey(pageKey) });
    toast({ title, duration: 2000 });
  };
  const onError = (err) => {
    toast({
      title: "Fehler beim Speichern",
      description: err.data?.error === "invalid_content"
        ? "Ein Text ist zu lang oder ungültig."
        : err.status === 403
          ? "Dir fehlt die Berechtigung «Inhalte bearbeiten»."
          : "Bitte versuche es später erneut.",
      variant: "destructive",
      duration: 3000,
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => peerskillslab.content.save(pageKey, draft),
    onSuccess: () => onSaved("Gespeichert, die Seite ist aktualisiert"),
    onError,
  });
  const resetMutation = useMutation({
    mutationFn: () => peerskillslab.content.reset(pageKey),
    onSuccess: () => { setConfirmReset(false); onSaved("Auf Standardtexte zurückgesetzt"); },
    onError,
  });

  // Ungespeicherte Änderungen nicht versehentlich verlieren
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const switchPage = (key) => {
    if (key === pageKey) return;
    if (dirty && !window.confirm("Ungespeicherte Änderungen gehen verloren. Trotzdem wechseln?")) return;
    setDraft(null);
    setOpenSection(0);
    setAnchor(null);
    setPageKey(key);
  };

  if (!isAdmin) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="psl-page" style={{ maxWidth: 1600 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inhalte</h1>
          <p className="text-muted-foreground mt-0.5">Texte der öffentlichen Infoseiten bearbeiten</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {PAGES.map((p) => (
          <Button key={p.key} type="button" size="sm"
            variant={p.key === pageKey ? "default" : "outline"}
            onClick={() => switchPage(p.key)}>
            {p.label}
          </Button>
        ))}
        <div className="flex gap-1 ml-auto xl:hidden">
          <Button type="button" size="sm" variant={mobileView === "edit" ? "secondary" : "ghost"} onClick={() => setMobileView("edit")}>Bearbeiten</Button>
          <Button type="button" size="sm" variant={mobileView === "preview" ? "secondary" : "ghost"} onClick={() => setMobileView("preview")}>Vorschau</Button>
        </div>
      </div>

      {isLoading || !draft ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="xl:grid xl:gap-6" style={{ gridTemplateColumns: "minmax(380px, 500px) minmax(0, 1fr)" }}>
          <div className={`min-w-0 flex flex-col ${mobileView === "edit" ? "" : "hidden xl:flex"}`}
            style={{ maxWidth: 760 }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-muted-foreground">
                {data?.updated_date
                  ? `Zuletzt geändert von ${data.updated_by || "unbekannt"} am ${new Date(data.updated_date).toLocaleString("de-CH")}`
                  : "Noch nicht geändert, es gelten die Standardtexte."}
              </p>
              <a href={page.path} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                Seite ansehen <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              {sections.map((s, si) => (
                <Section key={s.title || si} section={s} open={openSection === si}
                  onToggle={() => {
                    const opening = openSection !== si;
                    setOpenSection(opening ? si : -1);
                    if (opening && s.anchor) setAnchor({ id: s.anchor, n: Date.now() });
                  }}>
                  {s.fields.map((f) => (
                    <Field key={f.key || f.label} field={f} depth={0} value={draft[f.key]}
                      onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
                  ))}
                </Section>
              ))}
            </div>

            <div className="sticky bottom-0 mt-4 py-3 flex flex-wrap items-center gap-3 border-t border-border bg-background">
              <Button type="button" disabled={!dirty || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending && <Loader2 className="animate-spin" />}
                Speichern
              </Button>
              <Button type="button" variant="outline" disabled={!dirty} onClick={() => setDraft(saved)}>
                Änderungen verwerfen
              </Button>
              {dirty && <span className="text-xs text-amber-600">Ungespeicherte Änderungen</span>}
              <Button type="button" variant="ghost" className="ml-auto text-destructive"
                disabled={!data?.updated_date} onClick={() => setConfirmReset(true)}>
                Auf Standardtexte zurücksetzen
              </Button>
            </div>
          </div>

          <div className={`min-w-0 xl:sticky xl:top-4 xl:self-start ${mobileView === "preview" ? "" : "hidden xl:block"}`}
            style={{ height: "calc(100vh - 140px)", minHeight: 420 }}>
            <ContentPreview path={page.path} contentKey={pageKey} draft={draft} anchor={anchor} />
          </div>
        </div>
      )}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Auf Standardtexte zurücksetzen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle gespeicherten Änderungen an «{page.label}» werden gelöscht. Die Seite zeigt danach wieder die Texte aus dem Code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetMutation.mutate()}>Zurücksetzen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
