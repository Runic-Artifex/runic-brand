import type { Sigil } from "./model.js";
import { geometry, palette } from "./tokens.js";

const line = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}"/>`;

const polyline = (points: string) => `<polyline points="${points}"/>`;

const sigils: Record<Sigil, string> = {
  artifex: [
    `<rect x="-25" y="-25" width="50" height="50" transform="rotate(45)"/>`,
    `<rect x="-13" y="-13" width="26" height="26" transform="rotate(45)"/>`,
    line(-42, 0, -28, 0), line(28, 0, 42, 0), line(0, -42, 0, -28), line(0, 28, 0, 42),
    `<rect class="sigil-accent" x="-7" y="-7" width="14" height="14" transform="rotate(45)"/>`,
  ].join(""),
  toolkit: [
    line(-38, 0, 38, 0), line(0, -38, 0, 38), line(-27, -27, 27, 27), line(27, -27, -27, 27),
    polyline("-38,0 -29,-6 -29,6"), polyline("38,0 29,-6 29,6"),
    polyline("0,-38 -6,-29 6,-29"), polyline("0,38 -6,29 6,29"),
    `<rect x="-10" y="-10" width="20" height="20" transform="rotate(45)"/>`,
  ].join(""),
  webui: [
    `<rect x="-39" y="-31" width="78" height="62" rx="4"/>`,
    line(-39, -16, 39, -16),
    `<circle cx="-28" cy="-24" r="2"/><circle cx="-20" cy="-24" r="2"/><circle cx="-12" cy="-24" r="2"/>`,
    polyline("-17,-4 -29,8 -17,20"), polyline("17,-4 29,8 17,20"), line(7, -7, -7, 23),
  ].join(""),
  markup: [
    polyline("-10,-30 -38,0 -10,30"), polyline("10,-30 38,0 10,30"),
    line(-2, 34, 9, -34), `<rect class="sigil-accent" x="-5" y="-5" width="10" height="10" transform="rotate(45)"/>`,
  ].join(""),
  flow: [
    line(0, -38, 0, 35), `<circle cx="0" cy="-22" r="4"/><circle cx="0" cy="0" r="4"/>`,
    `<path d="M0 0C0 15-25 9-25 28"/>`, `<path d="M0 0C0 15 25 9 25 28"/>`,
    polyline("-32,20 -25,30 -18,20"), polyline("18,20 25,30 32,20"), polyline("-7,27 0,38 7,27"),
  ].join(""),
  assets: [
    polyline("0,-38 34,-20 0,-2 -34,-20 0,-38"),
    polyline("-34,-20 -34,19 0,38 34,19 34,-20"), line(0, -2, 0, 38),
    line(-34, 0, 0, 19), line(34, 0, 0, 19),
  ].join(""),
  "text-resources": [
    line(0, -39, 0, 39), line(-30, -27, 30, -27), line(-30, 27, 30, 27),
    `<path d="M-28-10H-10L0 0-10 10H-28Z"/>`,
    `<path d="M28-10H10L0 0 10 10H28Z"/>`,
    `<circle class="sigil-accent" cx="0" cy="0" r="5"/>`,
  ].join(""),
  "command-line": [
    polyline("-32,-24 -9,0 -32,24"), line(-2, 25, 34, 25),
    line(3, -21, 31, -21), line(3, -8, 24, -8),
  ].join(""),
  documentation: [
    `<path d="M0-27C-10-35-24-37-38-31V25C-23 20-10 22 0 31Z"/>`,
    `<path d="M0-27C10-35 24-37 38-31V25C23 20 10 22 0 31Z"/>`,
    line(0, -27, 0, 31), `<rect class="sigil-accent" x="-4" y="-42" width="8" height="8" transform="rotate(45)"/>`,
  ].join(""),
};

export function sigilSvg(
  sigil: Sigil,
  x: number,
  y: number,
  size: number,
  color = palette.gold,
  accent = palette.rust,
): string {
  const scale = size / 100;
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><style>.sigil-accent{fill:${accent};stroke:${accent}}</style>${sigils[sigil]}</g>`;
}

export function medallionSvg(
  sigil: Sigil,
  x: number,
  y: number,
  diameter: number,
  accent: string,
): string {
  const radius = diameter / 2;
  return [
    `<g>` ,
    `<circle cx="${x}" cy="${y}" r="${radius + 8}" fill="${palette.ink}" opacity=".72" stroke="${palette.goldDim}" stroke-width="1"/>`,
    `<circle cx="${x}" cy="${y}" r="${radius}" fill="url(#medallion)" stroke="${palette.gold}" stroke-width="${geometry.medallionRing}"/>`,
    `<circle cx="${x}" cy="${y}" r="${radius - 8}" fill="none" stroke="${palette.goldDim}" stroke-width="1"/>`,
    sigilSvg(sigil, x, y, diameter * 0.62, palette.gold, accent),
    `</g>`,
  ].join("");
}

export function frameSvg(width: number, height: number): string {
  const inset = geometry.borderInset;
  const corner = geometry.cornerSize;
  const right = width - inset;
  const bottom = height - inset;
  const corners = [
    `M${inset} ${inset + corner}V${inset}H${inset + corner}M${inset + 7} ${inset + corner - 6}L${inset + corner - 6} ${inset + 7}`,
    `M${right - corner} ${inset}H${right}V${inset + corner}M${right - corner + 6} ${inset + 7}L${right - 7} ${inset + corner - 6}`,
    `M${inset} ${bottom - corner}V${bottom}H${inset + corner}M${inset + 7} ${bottom - corner + 6}L${inset + corner - 6} ${bottom - 7}`,
    `M${right - corner} ${bottom}H${right}V${bottom - corner}M${right - corner + 6} ${bottom - 7}L${right - 7} ${bottom - corner + 6}`,
  ];
  return `<g fill="none" stroke="${palette.goldDim}" stroke-width="1.5" opacity=".9"><rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}"/>${corners.map((d) => `<path d="${d}"/>`).join("")}<path d="M${width / 2 - 22} ${inset}H${width / 2 - 8}L${width / 2} ${inset - 8}L${width / 2 + 8} ${inset}H${width / 2 + 22}"/><path d="M${width / 2 - 22} ${bottom}H${width / 2 - 8}L${width / 2} ${bottom + 8}L${width / 2 + 8} ${bottom}H${width / 2 + 22}"/></g>`;
}

export function ornamentSvg(x: number, y: number, scale = 1): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${palette.goldDim}" stroke-width="1.5" opacity=".5"><path d="M-16 0H-6L0-8 6 0H16M0-8V-19M-7-14L0-7 7-14"/><circle cx="0" cy="0" r="2" fill="${palette.goldDim}"/></g>`;
}
