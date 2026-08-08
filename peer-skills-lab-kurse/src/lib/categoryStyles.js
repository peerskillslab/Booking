/**
 * Canonical category color definitions
 * Used across CourseCard, Home, and CourseCalendar to ensure visual consistency
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

/**
 * Helper to convert hex color to a readable tailwind-like pastel bg/text/border
 * Used by CourseCalendar to generate consistent visual variants from the hex colors
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
