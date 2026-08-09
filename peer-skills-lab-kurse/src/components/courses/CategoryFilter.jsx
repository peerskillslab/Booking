import React from "react";
import { cn } from "@/lib/utils";

const categories = [
  { label: "Alle", value: "all", emoji: "✨" },
  { label: "CST Abdomen", value: "CST Abdomen", emoji: "🫁" },
  { label: "CST HKL", value: "CST HKL", emoji: "🫀" },
  { label: "CST Gynäkologie", value: "CST Gynäkologie", emoji: "🩺" },
  { label: "CST Lunge", value: "CST Lunge", emoji: "🫧" },
  { label: "CST Neurologie", value: "CST Neurologie", emoji: "🧠" },
  { label: "CST Bewegungsapparat", value: "CST Bewegungsapparat", emoji: "🦴" },
  { label: "POCUS", value: "POCUS", emoji: "🔬" },
  { label: "Venenpunktion", value: "Venenpunktion", emoji: "💉" },
  { label: "YSSA", value: "YSSA", emoji: "🪡" },
];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={cn(
            "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
            "border",
            selected === cat.value
              ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          <span className="mr-1.5">{cat.emoji}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}