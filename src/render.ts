import { fitVectorText, vectorText } from "./fonts.js";
import { frameSvg, medallionSvg, ornamentSvg, sigilSvg, starRuneSvg } from "./geometry.js";
import { getIdentity, identities } from "./identities.js";
import { materialBackground, materialDefinitions } from "./material.js";
import type { ArtDirection, BrandFormat, BrandIdentity, RenderOptions } from "./model.js";
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
  direction: ArtDirection,
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
  ${materialDefinitions(seed, direction)}
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
  const direction = options.direction ?? "engraved";
  const layout = socialLayout(direction);
  const titleSize = fitVectorText(identity.name, layout.titleSize, layout.titleWidth, "display", 48, layout.titleWeight);
  const taglineSize = fitVectorText(identity.tagline, layout.taglineSize, layout.taglineWidth, "sans", 21, 420);
  const title = vectorText(identity.name, {
    x: layout.left,
    baseline: layout.titleBaseline,
    size: titleSize,
    fill: "url(#parchment)",
    family: "display",
    weight: layout.titleWeight,
    filter: "url(#engraved-shadow)",
  }).svg;
  const tagline = vectorText(identity.tagline, {
    x: layout.left + 3,
    baseline: layout.taglineBaseline,
    size: taglineSize,
    fill: "url(#parchment)",
    family: "sans",
    weight: 420,
    opacity: 0.95,
  }).svg;
  const label = vectorText(identity.shortName, {
    x: layout.left + 98,
    baseline: 522,
    size: 25,
    fill: "url(#gold)",
    family: "sans",
    weight: 480,
  }).svg;

  const content = [
    backdrop(width, height, options.seed, options),
    atmosphericGeometry(direction),
    frameSvg(width, height, direction),
    `<path d="M${layout.left + 2} ${layout.ruleY}H${layout.ruleBreak - 18}M${layout.ruleBreak + 18} ${layout.ruleY}H${layout.ruleEnd}" fill="none" stroke="url(#gold)" stroke-width="1.7" opacity=".92"/>`,
    ornamentSvg(layout.ruleBreak, layout.ruleY, 0.76, 0.9),
    title,
    tagline,
    `<circle cx="${layout.left + 31}" cy="513" r="27" fill="#09100b" stroke="${identity.accent}" stroke-width="2.2"/>`,
    sigilSvg(identity.sigil, layout.left + 31, 513, 34, identity.accent, identity.accent),
    `<path d="M${layout.left + 65} 487V539" stroke="${palette.goldDim}"/>`,
    label,
    identity.id === "runic-artifex" ? constellationSvg(direction) : productOrbitSvg(identity, direction),
  ].join("\n");

  return root(identity, "social", content, options.seed, direction);
}

function renderBanner(identity: BrandIdentity, options: RenderOptions & { seed: number }): string {
  const { width, height } = dimensions.banner;
  const direction = options.direction ?? "engraved";
  const titleSize = fitVectorText(identity.name, 88, 970, "display", 54);
  const taglineSize = fitVectorText(identity.tagline, 29, 940, "sans", 22);
  const title = vectorText(identity.name, {
    x: 86,
    baseline: 224,
    size: titleSize,
    fill: "url(#parchment)",
    family: "display",
    weight: 440,
    filter: "url(#engraved-shadow)",
  }).svg;
  const tagline = vectorText(identity.tagline, {
    x: 90,
    baseline: 300,
    size: taglineSize,
    fill: "url(#parchment)",
    family: "sans",
    opacity: 0.92,
  }).svg;
  const content = [
    backdrop(width, height, options.seed, options),
    frameSvg(width, height, direction),
    `<path d="M90 257H430M455 257H1000" fill="none" stroke="${palette.gold}" stroke-width="2" opacity=".8"/>`,
    ornamentSvg(442, 257, 0.68),
    title,
    tagline,
    `<g opacity=".24"><circle cx="1320" cy="240" r="170" fill="none" stroke="${palette.goldDim}"/><circle cx="1320" cy="240" r="135" fill="none" stroke="${palette.goldDim}" stroke-dasharray="4 11"/>${ornamentSvg(1320, 58, 0.8)}${ornamentSvg(1320, 422, 0.8)}</g>`,
    medallionSvg(identity.sigil, 1320, 240, 190, identity.accent),
  ].join("\n");
  return root(identity, "banner", content, options.seed, direction);
}

function renderIcon(identity: BrandIdentity, options: RenderOptions & { seed: number }): string {
  const { width, height } = dimensions.icon;
  const direction = options.direction ?? "engraved";
  const content = [
    backdrop(width, height, options.seed, options),
    frameSvg(width, height, direction),
    `<circle cx="256" cy="256" r="187" fill="none" stroke="${palette.goldDim}" opacity=".34"/>`,
    `<circle cx="256" cy="256" r="164" fill="none" stroke="${palette.goldDim}" stroke-dasharray="5 14" opacity=".48"/>`,
    ornamentSvg(256, 64, 0.86),
    ornamentSvg(256, 448, 0.86),
    medallionSvg(identity.sigil, 256, 256, 248, identity.accent),
  ].join("\n");
  return root(identity, "icon", content, options.seed, direction);
}

function constellationSvg(direction: ArtDirection): string {
  const center = direction === "architectural" ? { x: 932, y: 315 } : { x: 930, y: 316 };
  const productIdentities = identities.filter(
    (identity) => identity.id !== "runic-artifex" && identity.id !== "runic-docs",
  );
  const radiusX = direction === "architectural" ? 184 : direction === "ritual" ? 198 : 190;
  const radiusY = direction === "architectural" ? 190 : direction === "ritual" ? 204 : 197;
  const nodes = productIdentities.map((identity, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / productIdentities.length;
    return {
      identity,
      x: center.x + Math.cos(angle) * radiusX,
      y: center.y + Math.sin(angle) * radiusY,
    };
  });
  const nodeDiameter = direction === "architectural" ? 62 : direction === "ritual" ? 75 : 70;
  const lineDash = direction === "architectural" ? "2 8" : "10 7";
  const polygon = nodes.map((node) => `${node.x.toFixed(2)},${node.y.toFixed(2)}`).join(" ");
  return `<g>
    <g fill="none" stroke="${palette.goldDim}" stroke-width=".75" opacity="${direction === "architectural" ? 0.12 : 0.24}">
      <ellipse cx="${center.x}" cy="${center.y}" rx="229" ry="142" transform="rotate(28 ${center.x} ${center.y})"/>
      <ellipse cx="${center.x}" cy="${center.y}" rx="229" ry="142" transform="rotate(-28 ${center.x} ${center.y})"/>
      <circle cx="${center.x}" cy="${center.y}" r="225" stroke-dasharray="1 13"/>
      <polygon points="${polygon}"/>
      <path d="M${center.x - 248} ${center.y - 74}L${center.x + 240} ${center.y + 95}M${center.x - 236} ${center.y + 108}L${center.x + 245} ${center.y - 63}" stroke-dasharray="3 12"/>
    </g>
    <ellipse cx="${center.x}" cy="${center.y}" rx="${radiusX + 28}" ry="${radiusY + 15}" fill="none" stroke="${palette.goldDim}" stroke-width=".8" opacity=".2"/>
    <ellipse cx="${center.x}" cy="${center.y}" rx="${radiusX}" ry="${radiusY}" fill="none" stroke="${palette.goldDim}" stroke-dasharray="4 10" opacity=".58"/>
    <ellipse cx="${center.x}" cy="${center.y}" rx="143" ry="151" fill="none" stroke="${palette.goldDim}" opacity=".27"/>
    <path d="M${center.x - radiusX - 47} ${center.y}H${center.x + radiusX + 47}M${center.x} ${center.y - radiusY - 38}V${center.y + radiusY + 38}" stroke="${palette.goldDim}" stroke-width=".8" stroke-dasharray="3 8" opacity=".32"/>
    ${nodes.map((node) => `<path d="M${center.x} ${center.y}L${node.x.toFixed(2)} ${node.y.toFixed(2)}" stroke="url(#gold)" stroke-width="1.35" stroke-dasharray="${lineDash}" opacity=".72"/><path d="M${((center.x + node.x) / 2 - 5).toFixed(2)} ${((center.y + node.y) / 2).toFixed(2)}l5-5 5 5-5 5Z" fill="#0b100d" stroke="${palette.gold}" stroke-width="1" opacity=".9"/>`).join("")}
    ${nodes.map((node) => medallionSvg(node.identity.sigil, node.x, node.y, nodeDiameter, node.identity.accent)).join("")}
    ${medallionSvg("artifex", center.x, center.y, direction === "ritual" ? 116 : 106, palette.rust, "primary")}
    ${ornamentSvg(center.x, center.y - radiusY - 48, 0.75, 0.5)}
    ${ornamentSvg(center.x, center.y + radiusY + 48, 0.75, 0.5)}
    ${axisStaffSvg(center.x, center.y - radiusY - 53, 1)}
    ${axisStaffSvg(center.x, center.y + radiusY + 53, -1)}
    ${sideRuneSvg(center.x - radiusX - 55, center.y)}
    ${sideRuneSvg(center.x + radiusX + 55, center.y)}
  </g>`;
}

function productOrbitSvg(identity: BrandIdentity, direction: ArtDirection): string {
  const x = 930;
  const y = 316;
  const siblings = identities.filter(
    (candidate) =>
      candidate.id !== identity.id &&
      candidate.id !== "runic-artifex" &&
      candidate.id !== "runic-docs",
  );
  const radiusX = 188;
  const radiusY = 194;
  const nodes = siblings.map((candidate, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / siblings.length;
    return {
      identity: candidate,
      x: x + Math.cos(angle) * radiusX,
      y: y + Math.sin(angle) * radiusY,
    };
  });
  const polygon = nodes.map((node) => `${node.x.toFixed(2)},${node.y.toFixed(2)}`).join(" ");
  return `<g>
    <g fill="none" stroke="${palette.goldDim}">
      <ellipse cx="${x}" cy="${y}" rx="220" ry="213" stroke-width=".7" opacity=".22"/>
      <ellipse cx="${x}" cy="${y}" rx="${radiusX}" ry="${radiusY}" stroke-dasharray="4 10" opacity=".54"/>
      <ellipse cx="${x}" cy="${y}" rx="145" ry="150" opacity=".26"/>
      <ellipse cx="${x}" cy="${y}" rx="220" ry="132" transform="rotate(31 ${x} ${y})" opacity=".17"/>
      <ellipse cx="${x}" cy="${y}" rx="220" ry="132" transform="rotate(-31 ${x} ${y})" opacity=".17"/>
      <polygon points="${polygon}" opacity=".24"/>
      <path d="M${x - 239} ${y}H${x + 239}M${x} ${y - 235}V${y + 235}" stroke-dasharray="2 9" opacity=".28"/>
    </g>
    ${nodes.map((node) => `<path d="M${x} ${y}L${node.x.toFixed(2)} ${node.y.toFixed(2)}" stroke="url(#gold)" stroke-width="1.35" stroke-dasharray="9 8" opacity=".67"/><path d="M${((x + node.x) / 2 - 5).toFixed(2)} ${((y + node.y) / 2).toFixed(2)}l5-5 5 5-5 5Z" fill="#0b100d" stroke="${palette.gold}" stroke-width="1" opacity=".85"/>`).join("")}
    <g opacity=".72">${nodes.map((node) => medallionSvg(node.identity.sigil, node.x, node.y, 57, node.identity.accent)).join("")}</g>
    ${medallionSvg(identity.sigil, x, y, direction === "ritual" ? 190 : 176, identity.accent, "primary")}
    ${axisStaffSvg(x, y - radiusY - 48, 1)}
    ${axisStaffSvg(x, y + radiusY + 48, -1)}
  </g>`;
}

function socialLayout(direction: ArtDirection): {
  left: number;
  titleSize: number;
  titleWidth: number;
  titleWeight: number;
  titleBaseline: number;
  taglineSize: number;
  taglineWidth: number;
  taglineBaseline: number;
  ruleY: number;
  ruleBreak: number;
  ruleEnd: number;
} {
  if (direction === "architectural") {
    return { left: 74, titleSize: 91, titleWidth: 590, titleWeight: 400, titleBaseline: 264, taglineSize: 28, taglineWidth: 590, taglineBaseline: 352, ruleY: 302, ruleBreak: 356, ruleEnd: 650 };
  }
  if (direction === "ritual") {
    return { left: 72, titleSize: 104, titleWidth: 625, titleWeight: 500, titleBaseline: 275, taglineSize: 31, taglineWidth: 612, taglineBaseline: 367, ruleY: 314, ruleBreak: 356, ruleEnd: 663 };
  }
  return { left: 74, titleSize: 114, titleWidth: 625, titleWeight: 500, titleBaseline: 275, taglineSize: 31, taglineWidth: 604, taglineBaseline: 365, ruleY: 313, ruleBreak: 356, ruleEnd: 650 };
}

function atmosphericGeometry(direction: ArtDirection): string {
  const stars = [
    starRuneSvg(675, 139, 24, direction === "architectural" ? 0.09 : 0.17),
    starRuneSvg(706, 432, 29, direction === "architectural" ? 0.08 : 0.2),
    starRuneSvg(1112, 144, 25, direction === "architectural" ? 0.08 : 0.18),
    starRuneSvg(1131, 472, 28, direction === "architectural" ? 0.08 : 0.17),
  ].join("");
  if (direction === "architectural") {
    return `<g opacity=".2"><path d="M666 88H1140M666 157H1140M666 226H1140M666 295H1140M666 364H1140M666 433H1140M720 62V560M790 62V560M860 62V560M930 62V560M1000 62V560M1070 62V560" stroke="${palette.goldDim}" stroke-width=".45"/>${stars}</g>`;
  }
  const ritual = direction === "ritual" ? `<g fill="none" stroke="${palette.goldDim}" opacity=".18"><circle cx="930" cy="316" r="259"/><circle cx="930" cy="316" r="238" stroke-dasharray="1 11"/><path d="M747 133L1113 499M1113 133L747 499"/></g>` : "";
  return `${ritual}${stars}`;
}

function axisStaffSvg(x: number, y: number, direction: -1 | 1): string {
  return `<g transform="translate(${x} ${y}) scale(1 ${direction})" fill="none" stroke="${palette.goldDim}" stroke-width="1.1" opacity=".38">
    <path d="M0 0V-48M-12-15L0-27L12-15M-9-34L0-43L9-34M-4-48L0-54L4-48"/>
    <path d="M-18-7H18M-14-11L-10-7L-14-3M14-11L10-7L14-3"/>
  </g>`;
}

function sideRuneSvg(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${palette.goldDim}" stroke-width="1" opacity=".32">
    <path d="M-18 0H18M0-18V18M-13-13L13 13M13-13L-13 13"/>
    <path d="M0-12L7 0L0 12L-7 0Z"/>
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
