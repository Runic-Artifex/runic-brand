import { palette } from "./tokens.js";

export function materialDefinitions(seed: number): string {
  return `<defs>
    <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${palette.ink}"/>
      <stop offset=".52" stop-color="#101914"/>
      <stop offset="1" stop-color="#07100b"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="43%" r="73%">
      <stop offset="0" stop-color="${palette.mossLight}" stop-opacity=".16"/>
      <stop offset=".56" stop-color="${palette.ink}" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".68"/>
    </radialGradient>
    <radialGradient id="medallion" cx="38%" cy="32%" r="72%">
      <stop offset="0" stop-color="${palette.mossLight}"/>
      <stop offset=".58" stop-color="${palette.moss}"/>
      <stop offset="1" stop-color="${palette.ink}"/>
    </radialGradient>
    <filter id="grain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".68" numOctaves="4" seed="${seed}" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values=".35 0 0 0 .18  0 .3 0 0 .17  0 0 .18 0 .1  0 0 0 .23 0"/>
    </filter>
    <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

export function materialBackground(width: number, height: number, seed: number): string {
  return [
    `<rect width="${width}" height="${height}" fill="url(#ground)"/>`,
    `<rect width="${width}" height="${height}" fill="url(#vignette)"/>`,
    `<rect width="${width}" height="${height}" filter="url(#grain)" opacity=".48"/>`,
  ].join("");
}
