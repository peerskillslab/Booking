import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TimeInput({ value, onChange, className }) {
  const [h, m] = value ? value.split(":") : ["", ""];

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  const update = (newH, newM) => {
    if (newH && newM) onChange(`${newH}:${newM}`);
    else if (newH) onChange(`${newH}:${m || "00"}`);
    else if (newM) onChange(`${h || "00"}:${newM}`);
  };

  return (
    <div className={`flex gap-1 items-center ${className || ""}`}>
      <Select value={h || ""} onValueChange={(v) => update(v, m)}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((hr) => <SelectItem key={hr} value={hr}>{hr}</SelectItem>)}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground font-bold">:</span>
      <Select value={m || ""} onValueChange={(v) => update(h, v)}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((min) => <SelectItem key={min} value={min}>{min}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}