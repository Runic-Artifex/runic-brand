export const formats = ["social", "banner", "icon"] as const;
export type BrandFormat = (typeof formats)[number];

export type Sigil =
  | "artifex"
  | "toolkit"
  | "webui"
  | "markup"
  | "flow"
  | "assets"
  | "text-resources"
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
  material?: boolean;
  transparent?: boolean;
  seed?: number;
};
