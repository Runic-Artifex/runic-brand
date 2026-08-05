import { createRequire } from "node:module";
import * as fontkit from "fontkit";

const require = createRequire(import.meta.url);
const displayPath = require.resolve(
  "@fontsource/cormorant/files/cormorant-latin-500-normal.woff2",
);
const sansPath = require.resolve(
  "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
);

const fonts = {
  display: fontkit.openSync(displayPath) as fontkit.Font,
  sans: fontkit.openSync(sansPath) as fontkit.Font,
} as const;

export type VectorTextOptions = {
  x: number;
  baseline: number;
  size: number;
  fill: string;
  family: keyof typeof fonts;
  anchor?: "start" | "middle" | "end";
  letterSpacing?: number;
  opacity?: number;
  weight?: number;
  filter?: string;
};

export type VectorText = {
  svg: string;
  width: number;
};

function number(value: number): string {
  return Number(value.toFixed(4)).toString();
}

export function measureVectorText(
  text: string,
  size: number,
  family: keyof typeof fonts,
  letterSpacing = 0,
  weight?: number,
): number {
  const font = fontFor(family, weight);
  const run = font.layout(text);
  const advances = run.positions.reduce((sum, position) => sum + position.xAdvance, 0);
  return (advances * size) / font.unitsPerEm + Math.max(0, text.length - 1) * letterSpacing;
}

export function fitVectorText(
  text: string,
  preferredSize: number,
  maximumWidth: number,
  family: keyof typeof fonts,
  minimumSize: number,
  weight?: number,
): number {
  const width = measureVectorText(text, preferredSize, family, 0, weight);
  if (width <= maximumWidth) return preferredSize;
  return Math.max(minimumSize, preferredSize * (maximumWidth / width));
}

export function vectorText(text: string, options: VectorTextOptions): VectorText {
  const font = fontFor(options.family, options.weight);
  const run = font.layout(text);
  const scale = options.size / font.unitsPerEm;
  const letterSpacing = options.letterSpacing ?? 0;
  const runWidth = run.positions.reduce((sum, position) => sum + position.xAdvance, 0);
  const width = (runWidth * options.size) / font.unitsPerEm + Math.max(0, text.length - 1) * letterSpacing;
  const anchorOffset =
    options.anchor === "middle" ? width / 2 : options.anchor === "end" ? width : 0;
  let cursor = options.x - anchorOffset;

  const paths = run.glyphs.map((glyph, index) => {
    const position = run.positions[index];
    const x = cursor + position.xOffset * scale;
    const y = options.baseline - position.yOffset * scale;
    cursor += position.xAdvance * scale + letterSpacing;
    const path = glyph.path.toSVG();
    return path
      ? `<path d="${path}" transform="translate(${number(x)} ${number(y)}) scale(${number(scale)} ${number(-scale)})"/>`
      : "";
  });

  return {
    width,
    svg: `<g fill="${options.fill}" opacity="${options.opacity ?? 1}"${options.filter ? ` filter="${options.filter}"` : ""} aria-label="${escapeXml(text)}">${paths.join("")}</g>`,
  };
}

function fontFor(family: keyof typeof fonts, _weight?: number): fontkit.Font {
  return fonts[family];
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
