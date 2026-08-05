import type { BrandPalette } from "./model.js";

export const palette: BrandPalette = Object.freeze({
  ink: "#0b100d",
  moss: "#18231b",
  mossLight: "#314536",
  parchment: "#eee4cb",
  gold: "#c9a65b",
  goldDim: "#75633a",
  rust: "#a65432",
});

export const typography = Object.freeze({
  display: "Cormorant Medium",
  sans: "Geist Variable",
  mono: "Geist Mono",
});

export const geometry = Object.freeze({
  lineWidth: 2,
  fineLineWidth: 1,
  borderInset: 22,
  cornerSize: 30,
  medallionRing: 4,
});
