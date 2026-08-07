import type { ArtDirection } from "./model.js";
import { palette } from "./tokens.js";

export function materialDefinitions(seed: number, direction: ArtDirection = "engraved"): string {
  const cloudOpacity = direction === "ritual" ? 0.32 : direction === "architectural" ? 0.16 : 0.25;
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
      <stop offset="0" stop-color="#26392c"/>
      <stop offset=".52" stop-color="${palette.moss}"/>
      <stop offset="1" stop-color="#050906"/>
    </radialGradient>
    <linearGradient id="parchment" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff9e8"/>
      <stop offset=".46" stop-color="${palette.parchment}"/>
      <stop offset="1" stop-color="#cdbf9e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#786034"/>
      <stop offset=".38" stop-color="#d4b36a"/>
      <stop offset=".63" stop-color="#9d7d40"/>
      <stop offset="1" stop-color="#e0c27c"/>
    </linearGradient>
    <linearGradient id="sigil-gold" gradientUnits="userSpaceOnUse" x1="-50" y1="-50" x2="50" y2="50">
      <stop offset="0" stop-color="#786034"/>
      <stop offset=".38" stop-color="#d4b36a"/>
      <stop offset=".63" stop-color="#9d7d40"/>
      <stop offset="1" stop-color="#e0c27c"/>
    </linearGradient>
    <pattern id="fibers" width="180" height="36" patternUnits="userSpaceOnUse">
      <path d="M-15 8C28 2 58 14 108 7S168 5 198 11M-20 27C22 21 76 33 126 25S173 24 204 29" fill="none" stroke="#c4ad72" stroke-width=".55" opacity=".12"/>
    </pattern>
    <filter id="patina" x="-12%" y="-12%" width="124%" height="124%">
      <feTurbulence type="fractalNoise" baseFrequency=".008 .021" numOctaves="4" seed="${seed}" stitchTiles="stitch" result="cloud"/>
      <feColorMatrix in="cloud" type="matrix" values=".18 0 0 0 .04  0 .22 0 0 .07  0 0 .12 0 .035  0 0 0 ${cloudOpacity} 0" result="tinted"/>
      <feBlend in="SourceGraphic" in2="tinted" mode="soft-light"/>
    </filter>
    <filter id="paper-grain" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency=".46" numOctaves="2" seed="${seed + 19}" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0" result="mono"/>
      <feComponentTransfer in="mono"><feFuncA type="linear" slope=".105"/></feComponentTransfer>
    </filter>
    <filter id="soft-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="engraved-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#000" flood-opacity=".75"/>
    </filter>
    <filter id="medallion-shadow" x="-45%" y="-45%" width="190%" height="200%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".72"/>
    </filter>
  </defs>`;
}

export function materialBackground(width: number, height: number, seed: number): string {
  return [
    `<rect width="${width}" height="${height}" fill="url(#ground)"/>`,
    `<rect width="${width}" height="${height}" fill="#17241a" filter="url(#patina)" opacity=".72"/>`,
    `<rect width="${width}" height="${height}" fill="url(#fibers)" opacity=".58"/>`,
    `<rect width="${width}" height="${height}" fill="#a9925b" filter="url(#paper-grain)" opacity=".2"/>`,
    `<rect width="${width}" height="${height}" fill="url(#vignette)"/>`,
  ].join("");
}
