export const formats = ["social", "banner", "icon", "presentation"] as const;
export type BrandFormat = (typeof formats)[number];

export const glyphs = [
  "runic",
  "application",
  "desktop",
  "assets",
  "translations",
  "command-line",
  "webui",
  "flow",
] as const;
export type Glyph = (typeof glyphs)[number];

/**
 * What an identity names. Packages and related projects get a basalt app tile;
 * an application, something people run, gets a stone tile.
 */
export type IdentityKind = "family" | "documentation" | "product" | "application" | "related";

export type BrandIdentity = {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  kind: IdentityKind;
  glyph: Glyph;
  /** Where the identity's source lives. */
  repository: string;
  /** NuGet package IDs that carry this identity's icon. A trailing `*` matches a prefix. */
  packages: readonly string[];
};

export type Scheme = {
  stone: string;
  raised: string;
  sunk: string;
  ink: string;
  inkSoft: string;
  groove: string;
  paint: string;
};

export type BrandPalette = {
  light: Scheme;
  dark: Scheme;
};

/** Filled outlines, split by the two colours of the stave grammar. */
export type MarkPaths = {
  width: number;
  height: number;
  /** Staves: the carved, vertical strokes. */
  ink: string;
  /** Twigs: the painted, diagonal strokes. */
  paint: string;
};
