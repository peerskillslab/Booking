import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

// Liest eine Uhrzeit aus schneller Eingabe: "18:15", "18.15", "18h15",
// "1815", "915", "9" → "HH:MM" (24 h). Ungültig → "".
export function parseTime(text) {
  const t = String(text || "").trim().replace(/\s+/g, "");
  let h, m;
  let match = /^(\d{1,2})[:.h](\d{1,2})$/i.exec(t);
  if (match) { h = +match[1]; m = +match[2]; }
  else if (/^\d{1,2}$/.test(t)) { h = +t; m = 0; }
  else if (/^\d{3,4}$/.test(t)) { h = +t.slice(0, -2); m = +t.slice(-2); }
  else return "";
  if (h > 23 || m > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Uhrzeit-Feld im 24-Stunden-Format. Früher Klapplisten (übernahmen auf Handys
// im Dialog die Auswahl nicht zuverlässig), danach das Zeitfeld des Browsers
// (zeigte in manchen Browsern AM/PM und meldete die Eingabe nicht zurück).
// Ein Textfeld funktioniert überall. onChange erhält "HH:MM" oder "" (ungültig).
export default function TimeInput({ value, onChange, className, placeholder = "hh:mm" }) {
  const [text, setText] = useState(value || "");

  // Von aussen gesetzte Werte übernehmen (Zurücksetzen, automatisch gefülltes «bis»)
  useEffect(() => {
    if ((value || "") !== parseTime(text)) setText(value || "");
    // text absichtlich nicht als Abhängigkeit: sonst würde jede Eingabe überschrieben
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const invalid = text.trim() !== "" && !parseTime(text);

  return (
    <Input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseTime(e.target.value));
      }}
      onBlur={() => { const p = parseTime(text); if (p) setText(p); }}
      aria-invalid={invalid || undefined}
      className={`${className || ""} ${invalid ? "border-destructive" : ""}`}
    />
  );
}
