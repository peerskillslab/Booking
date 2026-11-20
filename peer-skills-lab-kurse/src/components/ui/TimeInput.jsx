import React from "react";
import { Input } from "@/components/ui/input";

// Uhrzeit «HH:MM». Früher zwei Klapplisten (Stunde/Minute) – die übernahmen in
// Dialogen auf Handys und Tablets die Auswahl nicht immer, das Feld wirkte
// ausgefüllt und «Ausschreiben» blieb grau. Das eingebaute Zeitfeld des
// Browsers funktioniert auf allen Geräten (Viertelstunden-Schritte).
export default function TimeInput({ value, onChange, className }) {
  return (
    <Input
      type="time"
      step={900}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
}
