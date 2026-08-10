import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Up to two uppercase initials from a full name; "?" when unknown. */
export function getInitials(name) {
  if (!name) return "?";
  return String(name)
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Serialises rows to semicolon-separated CSV.
 * Quoting matters here: a course title containing ";" would otherwise shift
 * every following column. Excel needs the BOM to read UTF-8 correctly.
 */
export function toCsv(rows) {
  const escape = (cell) => {
    const s = cell === null || cell === undefined ? "" : String(cell);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(escape).join(";")).join("\n");
}

/** Triggers a browser download of `rows` as a CSV file. */
export function downloadCsv(rows, filename) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
