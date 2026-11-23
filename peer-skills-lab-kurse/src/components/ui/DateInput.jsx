import React, { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";

const pad = (n) => String(n).padStart(2, "0");

// "2026-11-21" → "21.11.2026"
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

// Liest ein Datum aus schneller Eingabe → "YYYY-MM-DD", ungültig → "".
// Versteht 21.11.2026, 21.11.26, 21.11. (ohne Jahr: nächstes passendes Datum),
// 21/11/2026, 21-11-2026, 21112026 und 2026-11-21.
export function parseDate(text, today = new Date()) {
  const t = String(text || "").trim();
  let d, m, y;
  let match;
  if ((match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))) {
    [y, m, d] = [+match[1], +match[2], +match[3]];
  } else if ((match = /^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2}|\d{4})?)?$/.exec(t))) {
    [d, m] = [+match[1], +match[2]];
    y = match[3] ? +match[3] : null;
  } else if ((match = /^(\d{2})(\d{2})(\d{4}|\d{2})$/.exec(t))) {
    [d, m, y] = [+match[1], +match[2], +match[3]];
  } else {
    return "";
  }
  if (y !== null && y < 100) y += 2000;
  if (y === null) {
    // Ohne Jahr: dieses Jahr, ausser das Datum ist schon vorbei
    y = today.getFullYear();
    const candidate = new Date(y, m - 1, d);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (candidate < startOfToday) y += 1;
  }
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return "";
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Datumsfeld im Format TT.MM.JJJJ. Das eingebaute Datumsfeld des Browsers
// übernahm in manchen Browsern (u. a. Safari) per Tastatur getippte Daten nicht,
// «Ausschreiben» blieb grau. Jetzt Textfeld + Kalender-Knopf (der Kalender des
// Browsers funktioniert zuverlässig). onChange erhält "YYYY-MM-DD" oder "".
export default function DateInput({ value, onChange, className }) {
  const [text, setText] = useState(formatDate(value));
  const pickerRef = useRef(null);

  // Von aussen gesetzte Werte übernehmen (Zurücksetzen, Auswahl im Kalender)
  useEffect(() => {
    if ((value || "") !== parseDate(text)) setText(formatDate(value));
    // text absichtlich nicht als Abhängigkeit: sonst würde jede Eingabe überschrieben
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const invalid = text.trim() !== "" && !parseDate(text);

  // Ohne showPicker (ältere Browser) öffnet das Tippen auf das Feld den Kalender selbst
  const openPicker = () => {
    try { pickerRef.current?.showPicker?.(); } catch { /* Browser öffnet ihn selbst */ }
  };

  return (
    <div className={`relative ${className || ""}`}>
      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="TT.MM.JJJJ"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseDate(e.target.value));
        }}
        onBlur={() => { const p = parseDate(text); if (p) setText(formatDate(p)); }}
        aria-invalid={invalid || undefined}
        className={`pr-10 ${invalid ? "border-destructive" : ""}`}
      />
      <span
        aria-hidden="true"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground pointer-events-none"
      >
        <CalendarDays className="w-4 h-4" />
      </span>
      {/* Unsichtbares Browser-Datumsfeld direkt über dem Kalender-Symbol:
          Ein Tippen darauf öffnet auf Handys den Kalender des Geräts, am
          Computer öffnet showPicker() ihn. Getippt wird im Textfeld daneben. */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        title="Kalender öffnen"
        aria-label="Kalender öffnen"
        value={value || ""}
        onClick={openPicker}
        onChange={(e) => { if (e.target.value) onChange(e.target.value); }}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 cursor-pointer"
      />
    </div>
  );
}
