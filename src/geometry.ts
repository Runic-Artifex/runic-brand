import type { ArtDirection, Sigil } from "./model.js";
import { geometry, palette } from "./tokens.js";

const line = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}"/>`;

const polyline = (points: string) => `<polyline points="${points}"/>`;
const diamond = (x: number, y: number, radius: number, className = "") =>
  `<path${className ? ` class="${className}"` : ""} d="M${x} ${y - radius}L${x + radius} ${y}L${x} ${y + radius}L${x - radius} ${y}Z"/>`;

// Every mark uses the same grammar: a 45-degree grid, open paths, diamonds,
// bilateral balance, and no literal interface chrome.
const sigils: Record<Sigil, string> = {
  artifex: [
    diamond(0, 0, 28), diamond(0, 0, 14),
    line(-44, 0, -29, 0), line(29, 0, 44, 0), line(0, -44, 0, -29), line(0, 29, 0, 44),
    diamond(0, 0, 6, "sigil-accent"),
  ].join(""),
  toolkit: [
    line(-39, 0, 39, 0), line(0, -39, 0, 39), line(-27, -27, 27, 27), line(27, -27, -27, 27),
    polyline("-39,0 -30,-6 -30,6"), polyline("39,0 30,-6 30,6"),
    polyline("0,-39 -6,-30 6,-30"), polyline("0,39 -6,30 6,30"),
    diamond(0, 0, 11), diamond(0, 0, 4, "sigil-accent"),
  ].join(""),
  webui: [
    polyline("-34,31 -34,-22 -22,-34 0,-22 22,-34 34,-22 34,31"),
    polyline("-24,31 -24,-13 0,0 24,-13 24,31"),
    line(-34, 18, 34, 18), diamond(0, 0, 6, "sigil-accent"),
  ].join(""),
  flow: [
    line(0, -39, 0, 8), polyline("0,8 -27,35"), polyline("0,8 27,35"), line(0, 8, 0, 39),
    diamond(0, -20, 5), diamond(0, 8, 6, "sigil-accent"), diamond(-27, 35, 4), diamond(0, 39, 4), diamond(27, 35, 4),
  ].join(""),
  assets: [
    diamond(0, -8, 30), polyline("-30,-8 -30,21 0,39 30,21 30,-8"),
    line(0, 22, 0, 39), line(-30, 7, 0, 24), line(30, 7, 0, 24),
    diamond(0, -8, 7, "sigil-accent"),
  ].join(""),
  "text-resources": [
    line(0, -40, 0, 40), polyline("0,-27 -26,-16 -35,-26"), polyline("0,-8 26,3 35,-7"),
    polyline("0,12 -24,23 -33,14"), polyline("0,30 17,38"),
    diamond(0, -8, 5, "sigil-accent"),
  ].join(""),
  "command-line": [
    polyline("-34,-31 -5,0 -34,31"), line(-5, 0, 33, 0),
    polyline("15,-16 33,0 15,16"), line(-16, 32, 33, 32),
    diamond(-5, 0, 5, "sigil-accent"),
  ].join(""),
  documentation: [
    polyline("0,-27 -15,-37 -36,-30 -36,25 -15,20 0,31"),
    polyline("0,-27 15,-37 36,-30 36,25 15,20 0,31"),
    line(0, -27, 0, 31), diamond(0, -42, 5, "sigil-accent"),
  ].join(""),
};

export function sigilSvg(
  sigil: Sigil,
  x: number,
  y: number,
  size: number,
  color = "url(#sigil-gold)",
  accent = palette.rust,
): string {
  const scale = size / 100;
  const geometry = sigils[sigil].replaceAll(
    'class="sigil-accent"',
    `fill="${accent}" stroke="${accent}"`,
  );
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter">${geometry}</g>`;
}

export function medallionSvg(
  sigil: Sigil,
  x: number,
  y: number,
  diameter: number,
  accent: string,
  emphasis: "primary" | "secondary" = "secondary",
): string {
  const radius = diameter / 2;
  const ring = emphasis === "primary" ? 4.5 : 3;
  const ticks = [0, 90, 180, 270]
    .map((angle) => {
      const radians = (angle * Math.PI) / 180;
      const inner = radius + 5;
      const outer = radius + (emphasis === "primary" ? 13 : 10);
      return line(
        Number((x + Math.cos(radians) * inner).toFixed(2)),
        Number((y + Math.sin(radians) * inner).toFixed(2)),
        Number((x + Math.cos(radians) * outer).toFixed(2)),
        Number((y + Math.sin(radians) * outer).toFixed(2)),
      );
    })
    .join("");
  return `<g filter="url(#medallion-shadow)">
    <circle cx="${x}" cy="${y}" r="${radius + 10}" fill="#050806" fill-opacity=".78" stroke="${palette.goldDim}" stroke-width="1"/>
    <circle cx="${x}" cy="${y}" r="${radius + 5}" fill="none" stroke="url(#gold)" stroke-width="1.2" opacity=".72"/>
    <circle cx="${x}" cy="${y}" r="${radius}" fill="url(#medallion)" stroke="url(#gold)" stroke-width="${ring}"/>
    <circle cx="${x}" cy="${y}" r="${radius - 8}" fill="none" stroke="${palette.goldDim}" stroke-width="1.1" opacity=".9"/>
    <circle cx="${x - radius * 0.25}" cy="${y - radius * 0.32}" r="${radius * 0.52}" fill="none" stroke="#f3d991" stroke-width=".65" opacity=".26"/>
    <g fill="none" stroke="${palette.goldDim}" stroke-width="1.2" opacity=".8">${ticks}</g>
    ${sigilSvg(sigil, x, y, diameter * 0.58, "url(#sigil-gold)", accent)}
  </g>`;
}

export function frameSvg(width: number, height: number, direction: ArtDirection = "engraved"): string {
  const inset = geometry.borderInset;
  const right = width - inset;
  const bottom = height - inset;
  const density = direction === "architectural" ? 0.58 : direction === "ritual" ? 1 : 0.84;
  const corner = (x: number, y: number, sx: number, sy: number) => `<g transform="translate(${x} ${y}) scale(${sx} ${sy})">
    <path d="M0 46L46 0"/>
    <path d="M0 0L24 24M24 0V24L14 34L5 27L14 18L24 24M24 0L34 10"/>
    <path d="M34 27L36 31L40 33L36 35L34 39L32 35L28 33L32 31Z" fill="${palette.goldDim}" stroke="none" opacity=".8"/>
    <path d="M14 58V76M58 14H76" opacity=".72"/>
  </g>`;
  const midpoint = (x: number, y: number, rotate = 0) => `<g transform="translate(${x} ${y}) rotate(${rotate})"><path d="M-28 0H-12L0-12L12 0H28M-7 0L0 7L7 0"/><path d="M0-12V-22M-4-17L0-13L4-17" opacity=".7"/></g>`;
  return `<g fill="none" stroke="url(#gold)" stroke-width="1.25" opacity="${density}">
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}"/>
    ${corner(inset, inset, 1, 1)}${corner(right, inset, -1, 1)}${corner(inset, bottom, 1, -1)}${corner(right, bottom, -1, -1)}
    ${midpoint(width / 2, inset)}${midpoint(width / 2, bottom, 180)}${midpoint(inset, height / 2, -90)}${midpoint(right, height / 2, 90)}
    <path d="M${inset + 12} ${height / 2 - 94}V${height / 2 - 67}M${inset + 12} ${height / 2 + 67}V${height / 2 + 94}M${right - 12} ${height / 2 - 94}V${height / 2 - 67}M${right - 12} ${height / 2 + 67}V${height / 2 + 94}" opacity=".7"/>
  </g>`;
}

export function ornamentSvg(x: number, y: number, scale = 1, opacity = 0.62): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="${opacity}"><path d="M-20 0H-8L0-9 8 0H20M0-9V-24M-8-17L0-9 8-17M-4-24L0-28 4-24"/><circle cx="0" cy="0" r="2" fill="${palette.gold}"/></g>`;
}

export function starRuneSvg(x: number, y: number, size = 28, opacity = 0.22): string {
  const d = size / 2;
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${palette.goldDim}" stroke-width="1" opacity="${opacity}"><path d="M-${d} 0H${d}M0-${d}V${d}M-${d * 0.72}-${d * 0.72}L${d * 0.72} ${d * 0.72}M${d * 0.72}-${d * 0.72}L-${d * 0.72} ${d * 0.72}"/><path d="M0-${d - 4}L4-4L${d - 4} 0L4 4L0 ${d - 4}L-4 4L-${d - 4} 0L-4-4Z"/></g>`;
}
