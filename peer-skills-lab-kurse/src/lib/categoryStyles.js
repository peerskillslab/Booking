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
 * Legacy function for backward compatibility.
 * Generates hex-based color variants from a hex color.
 * Kept for gradual migration; prefer getCategoryOklch() for new code.
 */
export function getCategoryColorVariant(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Generate a light pastel background (85% lighter than hex)
  const bgR = Math.min(255, Math.round(r + (255 - r) * 0.85));
  const bgG = Math.min(255, Math.round(g + (255 - g) * 0.85));
  const bgB = Math.min(255, Math.round(b + (255 - b) * 0.85));
  const bgHex = `#${bgR.toString(16).padStart(2, "0")}${bgG.toString(16).padStart(2, "0")}${bgB.toString(16).padStart(2, "0")}`;

  // Generate a light border (50% lighter)
  const borderR = Math.min(255, Math.round(r + (255 - r) * 0.5));
  const borderG = Math.min(255, Math.round(g + (255 - g) * 0.5));
  const borderB = Math.min(255, Math.round(b + (255 - b) * 0.5));
  const borderHex = `#${borderR.toString(16).padStart(2, "0")}${borderG.toString(16).padStart(2, "0")}${borderB.toString(16).padStart(2, "0")}`;

  return {
    bg: bgHex,
    text: hexColor,
    border: borderHex,
  };
}

/**
 * Legacy CATEGORY_COLORS for backward compatibility.
 * Kept during migration; will be removed once all call-sites use CATEGORY_HUES + getCategoryOklch().
 */
export const CATEGORY_COLORS = {
  "CST Abdomen": "#C0563B",
  "CST HKL": "#D9714D",
  "CST Gynäkologie": "#C8963B",
  "CST Lunge": "#B8743B",
  "CST Neurologie": "#A0873B",
  "CST Bewegungsapparat": "#8A8D2F",
  "POCUS": "#C9962B",
  "Venenpunktion": "#2D8C9E",
  "YSSA": "#8A8D2F",
};
