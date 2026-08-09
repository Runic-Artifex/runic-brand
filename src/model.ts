export const formats = ["social", "banner", "icon"] as const;
export type BrandFormat = (typeof formats)[number];

export const artDirections = ["engraved", "architectural", "ritual"] as const;
export type ArtDirection = (typeof artDirections)[number];

export type Sigil =
  | "artifex"
  | "toolkit"
  | "webui"
  | "flow"
  | "assets"
  | "translations"
  | "translations-editor"
  | "command-line"
  | "documentation";

export type BrandIdentity = {
  id: string;
  name: string;
  shortName: string;
  monogram: string;
  tagline: string;
  accent: string;
  sigil: Sigil;
  repository: string;
};

export type BrandPalette = {
  ink: string;
  moss: string;
  mossLight: string;
  parchment: string;
  gold: string;
  goldDim: string;
  rust: string;
};

export type RenderOptions = {
  direction?: ArtDirection;
  material?: boolean;
  transparent?: boolean;
  seed?: number;
};
