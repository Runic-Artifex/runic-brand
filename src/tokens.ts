import type { BrandPalette } from "./model.js";

/**
 * Runestones were carved, then painted: red ochre filled the cut lines so the
 * inscription could be read, and the paint was renewed while the carving
 * lasted. The palette keeps that split. Stone is the ground, ink is the
 * carving, and paint marks the strokes that carry meaning.
 */
export const palette: BrandPalette = Object.freeze({
  light: Object.freeze({
    stone: "#ecede8",
    raised: "#f7f7f4",
    sunk: "#e1e2dc",
    ink: "#1f2427",
    inkSoft: "#4e565b",
    groove: "#c8cac2",
    paint: "#ae3b23",
  }),
  dark: Object.freeze({
    stone: "#15181a",
    raised: "#1c2023",
    sunk: "#101214",
    ink: "#e6e7e1",
    inkSoft: "#a3a9a6",
    groove: "#30363a",
    paint: "#e4704f",
  }),
});

export const typography = Object.freeze({
  sans: "Schibsted Grotesk",
  mono: "Spline Sans Mono",
});

/** Stroke widths of the stave grammar, in units of a 100-unit cap height or glyph box. */
export const grammar = Object.freeze({
  capHeight: 100,
  wordmarkStave: 16,
  wordmarkGap: 20,
  glyphStave: 13,
  glyphBand: Object.freeze({ top: 6, bottom: 94 }),
});
