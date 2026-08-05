import { fitVectorText, vectorText } from "./fonts.js";
import { frameSvg, medallionSvg, ornamentSvg, sigilSvg } from "./geometry.js";
import { getIdentity, identities } from "./identities.js";
import { materialBackground, materialDefinitions } from "./material.js";
import type { BrandFormat, BrandIdentity, RenderOptions } from "./model.js";
import { palette } from "./tokens.js";

export const dimensions: Record<BrandFormat, { width: number; height: number }> = {
  social: { width: 1200, height: 630 },
  banner: { width: 1600, height: 480 },
  icon: { width: 512, height: 512 },
};

export function renderBrandAsset(
  identityId: string,
  format: BrandFormat,
  options: RenderOptions = {},
): string {
  const identity = getIdentity(identityId);
  const seed = options.seed ?? identitySeed(identity.id);
  switch (format) {
    case "social":
      return renderSocial(identity, { ...options, seed });
    case "banner":
      return renderBanner(identity, { ...options, seed });
    case "icon":
      return renderIcon(identity, { ...options, seed });
  }
}

function root(
  identity: BrandIdentity,
  format: BrandFormat,
  content: string,
  seed: number,
): string {
  const { width, height } = dimensions[format];
  const title = `${identity.name} ${format}`;
  const normalizedContent = content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">Generated from the Runic Artifex vector brand system.</desc>
  ${materialDefinitions(seed)}
${normalizedContent}
</svg>
`;
}

function backdrop(
  width: number,
  height: number,
  seed: number,
  options: RenderOptions,
): string {
  if (options.transparent) return "";
  if (options.material === false) {
    return `<rect width="${width}" height="${height}" fill="${palette.ink}"/>`;
  }
  return materialBackground(width, height, seed);
}

function renderSocial(identity: BrandIdentity, options: RenderOptions & { seed: number }): string {
  const { width, height } = dimensions.social;
  const titleSize = fitVectorText(identity.name, 91, 615, "display", 48);
  const taglineSize = fitVectorText(identity.tagline, 31, 620, "sans", 22);
  const title = vectorText(identity.name, {
    x: 72,
    baseline: 272,
    size: titleSize,
    fill: palette.parchment,
    family: "display",
  }).svg;
  const tagline = vectorText(identity.tagline, {
    x: 76,
    baseline: 355,
    size: taglineSize,
    fill: palette.parchment,
    family: "sans",
    opacity: 0.94,
  }).svg;
  const label = vectorText(identity.shortName, {
    x: 142,
    baseline: 526,
    size: 27,
    fill: palette.gold,
    family: "sans",
  }).svg;

  const content = [
    backdrop(width, height, options.seed, options),
    frameSvg(width, height),
    `<path d="M76 307H338M365 307H649" fill="none" stroke="${palette.gold}" stroke-width="2" opacity=".86"/>`,
    ornamentSvg(352, 307, 0.72),
    title,
    tagline,
    `<circle cx="106" cy="517" r="27" fill="${palette.ink}" stroke="${identity.accent}" stroke-width="2"/>`,
    sigilSvg(identity.sigil, 106, 517, 34, identity.accent, identity.accent),
    `<path d="M134 491V543" stroke="${palette.goldDim}"/>`,
    label,
    identity.id === "runic-artifex" ? constellationSvg() : productOrbitSvg(identity),
  ].join("\n");

  return root(identity, "social", content, options.seed);
}

function renderBanner(identity: BrandIdentity, options: RenderOptions & { seed: number }): string {
  const { width, height } = dimensions.banner;
  const titleSize = fitVectorText(identity.name, 88, 970, "display", 54);
  const taglineSize = fitVectorText(identity.tagline, 29, 940, "sans", 22);
  const title = vectorText(identity.name, {
    x: 86,
    baseline: 224,
    size: titleSize,
    fill: palette.parchment,
    family: "display",
  }).svg;
  const tagline = vectorText(identity.tagline, {
    x: 90,
    baseline: 300,
    size: taglineSize,
    fill: palette.parchment,
    family: "sans",
    opacity: 0.92,
  }).svg;
  const content = [
    backdrop(width, height, options.seed, options),
    frameSvg(width, height),
    `<path d="M90 257H430M455 257H1000" fill="none" stroke="${palette.gold}" stroke-width="2" opacity=".8"/>`,
    ornamentSvg(442, 257, 0.68),
    title,
    tagline,
    `<g opacity=".24"><circle cx="1320" cy="240" r="170" fill="none" stroke="${palette.goldDim}"/><circle cx="1320" cy="240" r="135" fill="none" stroke="${palette.goldDim}" stroke-dasharray="4 11"/>${ornamentSvg(1320, 58, 0.8)}${ornamentSvg(1320, 422, 0.8)}</g>`,
    medallionSvg(identity.sigil, 1320, 240, 190, identity.accent),
  ].join("\n");
  return root(identity, "banner", content, options.seed);
}

function renderIcon(identity: BrandIdentity, options: RenderOptions & { seed: number }): string {
  const { width, height } = dimensions.icon;
  const content = [
    backdrop(width, height, options.seed, options),
    frameSvg(width, height),
    `<circle cx="256" cy="256" r="187" fill="none" stroke="${palette.goldDim}" opacity=".34"/>`,
    `<circle cx="256" cy="256" r="164" fill="none" stroke="${palette.goldDim}" stroke-dasharray="5 14" opacity=".48"/>`,
    ornamentSvg(256, 64, 0.86),
    ornamentSvg(256, 448, 0.86),
    medallionSvg(identity.sigil, 256, 256, 248, identity.accent),
  ].join("\n");
  return root(identity, "icon", content, options.seed);
}

function constellationSvg(): string {
  const center = { x: 930, y: 316 };
  const productIdentities = identities.filter(
    (identity) => identity.id !== "runic-artifex" && identity.id !== "runic-docs",
  );
  const radiusX = 194;
  const radiusY = 187;
  const nodes = productIdentities.map((identity, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / productIdentities.length;
    return {
      identity,
      x: center.x + Math.cos(angle) * radiusX,
      y: center.y + Math.sin(angle) * radiusY,
    };
  });
  return `<g>
    <ellipse cx="${center.x}" cy="${center.y}" rx="${radiusX}" ry="${radiusY}" fill="none" stroke="${palette.goldDim}" stroke-dasharray="4 10" opacity=".46"/>
    <ellipse cx="${center.x}" cy="${center.y}" rx="145" ry="140" fill="none" stroke="${palette.goldDim}" opacity=".22"/>
    ${nodes.map((node) => `<path d="M${center.x} ${center.y}L${node.x.toFixed(2)} ${node.y.toFixed(2)}" stroke="${palette.goldDim}" stroke-width="1.4" stroke-dasharray="8 7" opacity=".7"/>`).join("")}
    ${nodes.map((node) => medallionSvg(node.identity.sigil, node.x, node.y, 59, node.identity.accent)).join("")}
    ${medallionSvg("artifex", center.x, center.y, 92, palette.rust)}
  </g>`;
}

function productOrbitSvg(identity: BrandIdentity): string {
  const x = 928;
  const y = 315;
  const points = [
    { x: 928, y: 110 },
    { x: 1105, y: 418 },
    { x: 751, y: 418 },
  ];
  return `<g>
    <circle cx="${x}" cy="${y}" r="204" fill="none" stroke="${palette.goldDim}" stroke-dasharray="5 11" opacity=".4"/>
    <circle cx="${x}" cy="${y}" r="151" fill="none" stroke="${palette.goldDim}" opacity=".24"/>
    ${points.map((point) => `<path d="M${x} ${y}L${point.x} ${point.y}" stroke="${palette.goldDim}" stroke-width="1.5" stroke-dasharray="8 8" opacity=".68"/>`).join("")}
    ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="27" fill="${palette.ink}" stroke="${palette.goldDim}" stroke-width="2"/><rect x="${point.x - 7}" y="${point.y - 7}" width="14" height="14" transform="rotate(45 ${point.x} ${point.y})" fill="none" stroke="${identity.accent}" stroke-width="2"/>`).join("")}
    ${medallionSvg(identity.sigil, x, y, 176, identity.accent)}
  </g>`;
}

function identitySeed(id: string): number {
  let hash = 17;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) % 997;
  return hash;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
