import { escapeXml, measureVectorText, vectorText, wrapVectorText, type Weight } from "./fonts.js";
import { glyph, markGroup, wordmark } from "./geometry.js";
import { getIdentity } from "./identities.js";
import type { BrandFormat, BrandIdentity } from "./model.js";
import { palette } from "./tokens.js";

export const dimensions: Record<BrandFormat, { width: number; height: number }> = {
  social: { width: 1200, height: 630 },
  banner: { width: 1600, height: 480 },
  icon: { width: 512, height: 512 },
  presentation: { width: 1600, height: 900 },
};

/**
 * Every wide format shares one composition: words on stone, the identity's
 * glyph on basalt, and the boundary between them as the seam.
 */
type Layout = {
  seam: number;
  inset: number;
  glyphSize: number;
  lockupCap: number;
  wordmarkCap: number;
  titleSize: number;
  taglineSize: number;
  footerSize: number;
  textWidth: number;
};

const layouts: Record<Exclude<BrandFormat, "icon">, Layout> = {
  social: {
    seam: 744,
    inset: 64,
    glyphSize: 272,
    lockupCap: 26,
    wordmarkCap: 92,
    titleSize: 72,
    taglineSize: 36,
    footerSize: 22,
    textWidth: 600,
  },
  banner: {
    seam: 1136,
    inset: 80,
    glyphSize: 248,
    lockupCap: 24,
    wordmarkCap: 84,
    titleSize: 68,
    taglineSize: 32,
    footerSize: 20,
    textWidth: 960,
  },
  presentation: {
    seam: 1056,
    inset: 96,
    glyphSize: 380,
    lockupCap: 32,
    wordmarkCap: 132,
    titleSize: 104,
    taglineSize: 46,
    footerSize: 26,
    textWidth: 820,
  },
};

const light = palette.light;
const dark = palette.dark;

export function renderBrandAsset(identityId: string, format: BrandFormat): string {
  const identity = getIdentity(identityId);
  const { width, height } = dimensions[format];
  const content = format === "icon" ? renderIcon(identity) : renderWide(identity, layouts[format], width, height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">${escapeXml(`${identity.name} ${format}`)}</title>
<desc id="description">${escapeXml(identity.tagline)}</desc>
${content}
</svg>
`;
}

function renderIcon(identity: BrandIdentity): string {
  const size = 512;
  const mark = 304;
  const offset = (size - mark) / 2;
  // An application people run sits on stone; packages and projects on basalt.
  const scheme = identity.kind === "application" ? light : dark;
  const ground = identity.kind === "application" ? light.raised : dark.raised;
  return [
    `<rect width="${size}" height="${size}" fill="${ground}"/>`,
    markGroup(glyph(identity.glyph), scheme, { x: offset, y: offset, scale: mark / 100 }),
  ].join("\n");
}

function renderWide(identity: BrandIdentity, layout: Layout, width: number, height: number): string {
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${light.stone}"/>`,
    `<rect x="${layout.seam}" width="${width - layout.seam}" height="${height}" fill="${dark.raised}"/>`,
  ];

  const panel = width - layout.seam;
  const glyphX = layout.seam + (panel - layout.glyphSize) / 2;
  const glyphY = (height - layout.glyphSize) / 2;
  parts.push(markGroup(glyph(identity.glyph), dark, { x: glyphX, y: glyphY, scale: layout.glyphSize / 100 }));

  const family = identity.kind === "family";
  const footer = identity.repository.replace(/^https:\/\//, "");
  const footerBaseline = height - layout.inset;
  const lines = wrapVectorText(identity.tagline, layout.taglineSize, layout.textWidth, 400);
  const taglineLeading = layout.taglineSize * 1.24;
  const taglineGap = layout.taglineSize * (family ? 2.2 : 1.45);
  const taglineHeight = taglineGap + (lines.length - 1) * taglineLeading;

  // The heading and tagline sit centred between the top inset and the footer.
  const available = footerBaseline - layout.footerSize * 2 - layout.inset;
  if (family) {
    // The family card is the wordmark itself, set large.
    const cap = layout.wordmarkCap;
    const top = layout.inset + (available - cap - taglineHeight) / 2;
    parts.push(lockup(layout.inset, top, cap, 0.5));
    pushTagline(parts, lines, layout, top + cap + taglineGap, taglineLeading);
  } else {
    parts.push(lockup(layout.inset, layout.inset, layout.lockupCap, 0.96));
    const titleSize = fitSize(identity.name, layout.titleSize, layout.seam - layout.inset * 2, 600);
    const blockTop = layout.inset + layout.lockupCap;
    const titleBaseline =
      blockTop + (available - layout.lockupCap - titleSize * 0.72 - taglineHeight) / 2 + titleSize * 0.72;
    parts.push(
      vectorText(identity.name, {
        x: layout.inset - titleSize * 0.04,
        baseline: titleBaseline,
        size: titleSize,
        weight: 600,
        fill: light.ink,
        letterSpacing: -titleSize * 0.012,
      }).svg,
    );
    pushTagline(parts, lines, layout, titleBaseline + taglineGap, taglineLeading);
  }

  parts.push(
    vectorText(family ? "runic-artifex.eu" : footer, {
      x: layout.inset,
      baseline: footerBaseline,
      size: layout.footerSize,
      weight: 500,
      fill: light.inkSoft,
    }).svg,
  );
  return parts.join("\n");
}

function pushTagline(parts: string[], lines: string[], layout: Layout, firstBaseline: number, leading: number): void {
  lines.forEach((text, index) => {
    parts.push(
      vectorText(text, {
        x: layout.inset,
        baseline: firstBaseline + index * leading,
        size: layout.taglineSize,
        weight: 400,
        fill: light.inkSoft,
      }).svg,
    );
  });
}

/** The RUNIC wordmark with the Artifex descriptor on its baseline. */
function lockup(x: number, top: number, cap: number, descriptor: number): string {
  const mark = wordmark();
  const scale = cap / 100;
  const size = cap * descriptor;
  const descriptorX = x + mark.width * scale + size * 0.4;
  return [
    markGroup(mark, light, { x, y: top, scale }),
    vectorText("Artifex", {
      x: descriptorX,
      baseline: top + cap,
      size,
      weight: 500,
      fill: light.ink,
    }).svg,
  ].join("\n");
}

function fitSize(text: string, preferred: number, maximumWidth: number, weight: Weight): number {
  const measured = measureVectorText(text, preferred, weight);
  return measured <= maximumWidth ? preferred : Math.floor(preferred * (maximumWidth / measured));
}
