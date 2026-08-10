/**
 * Canonical category color definitions — OKLCH hue-based system
 * All categories share identical chroma/lightness; only hue varies.
 * Used across CourseCard, Home, CourseCalendar, MyStats, and Admin screens.
 */

/**
 * Hue assignments (0–360) for the 9 categories.
 * Hues sourced from design handoff (5 explicit) + distributed to remaining 4.
 */
export const CATEGORY_HUES = {
  "CST HKL": 15,
  "CST Abdomen": 40,
  "Venenpunktion": 85,
  "CST Bewegungsapparat": 135,
  "POCUS": 195,
  "CST Lunge": 250,
  "CST Neurologie": 285,
  "YSSA": 310,
  "CST Gynäkologie": 340,
};

/**
 * Returns OKLCH color palette for a given category.
 * Shared chroma/lightness; hue varies per category.
 *
 * @param {string} category — e.g., "CST Abdomen"
 * @param {Object} opts — { dark?: boolean } for dark-mode variants
 * @returns {{ solid, bg, text, border }} — oklch() color values
 *
 * Light mode:
 *   - solid: saturated dot/icon fill
 *   - bg: pale pill/card background
 *   - text: medium-saturation readable text
 *   - border: subtle border line
 *
 * Dark mode (opts.dark=true):
 *   - solid: brighter dot/icon for contrast
 *   - bg: darker card, less saturation
 *   - text: brighter text for contrast
 *   - border: visible but subdued
 */
export function getCategoryOklch(category, opts = {}) {
  const hue = CATEGORY_HUES[category] ?? 130;
  const dark = opts.dark;

  if (dark) {
    return {
      solid: `oklch(52% 0.10 ${hue})`,     // Medium-light, saturated (dark-mode icon)
      bg: `oklch(28% 0.05 ${hue})`,        // Very dark, minimal chroma
      text: `oklch(72% 0.10 ${hue})`,      // Bright, saturated (readable)
      border: `oklch(38% 0.06 ${hue})`,    // Dark, subtle
    };
  }

  // Light mode
  return {
    solid: `oklch(52% 0.10 ${hue})`,       // Medium, saturated (light-mode icon/dot)
    bg: `oklch(94% 0.03 ${hue})`,          // Very pale background
    text: `oklch(41% 0.10 ${hue})`,        // Dark, readable text
    border: `oklch(88% 0.03 ${hue})`,      // Faint border
  };
}

/**
 * Status palette for courses and bookings. Same OKLCH recipe as the category
 * colours, so status pills sit visually next to category pills.
 * Previously this ternary was copy-pasted across four screens.
 */
const STATUS_HUES = { positive: 135, danger: 25, neutral: 130 };

const STATUS_TONE = {
  // Kurse
  active: "positive",
  completed: "neutral",
  cancelled: "danger",
  draft: "neutral",
  // Buchungen
  confirmed: "positive",
  pending: "neutral",
  past: "neutral",
};

export const STATUS_LABELS = {
  active: "Aktiv",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
  draft: "Entwurf",
  confirmed: "Bestätigt",
  pending: "Ausstehend",
  past: "Vergangen",
};

export function getStatusStyle(status, opts = {}) {
  const hue = STATUS_HUES[STATUS_TONE[status] ?? "neutral"];
  const chroma = STATUS_TONE[status] === "neutral" ? 0.01 : 0.10;
  const bgChroma = STATUS_TONE[status] === "neutral" ? 0.006 : 0.03;

  if (opts.dark) {
    return {
      bg: `oklch(28% ${bgChroma} ${hue})`,
      text: `oklch(72% ${chroma} ${hue})`,
      border: `oklch(38% ${bgChroma * 2} ${hue})`,
    };
  }
  return {
    bg: `oklch(94% ${bgChroma} ${hue})`,
    text: `oklch(41% ${chroma} ${hue})`,
    border: `oklch(88% ${bgChroma} ${hue})`,
  };
}
