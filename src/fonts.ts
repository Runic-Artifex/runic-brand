import { createRequire } from "node:module";
import * as fontkit from "fontkit";

const require = createRequire(import.meta.url);
const weights = [400, 500, 600] as const;
export type Weight = (typeof weights)[number];

const fonts = new Map<Weight, fontkit.Font>(
  weights.map((weight) => [
    weight,
    fontkit.openSync(
      require.resolve(`@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-${weight}-normal.woff2`),
    ) as fontkit.Font,
  ]),
);

export type VectorTextOptions = {
  x: number;
  baseline: number;
  size: number;
  fill: string;
  weight?: Weight;
  anchor?: "start" | "middle" | "end";
  letterSpacing?: number;
};

export type VectorText = {
  svg: string;
  width: number;
};

function number(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function fontFor(weight: Weight = 400): fontkit.Font {
  const font = fonts.get(weight);
  if (!font) throw new Error(`No Schibsted Grotesk instance for weight ${weight}.`);
  return font;
}

export function measureVectorText(text: string, size: number, weight?: Weight, letterSpacing = 0): number {
  const font = fontFor(weight);
  const run = font.layout(text);
  const advances = run.positions.reduce((sum, position) => sum + position.xAdvance, 0);
  return (advances * size) / font.unitsPerEm + Math.max(0, text.length - 1) * letterSpacing;
}

/**
 * Breaks text into the fewest lines that fit, then evens out their lengths so
 * the last line is not a single orphaned word.
 */
export function wrapVectorText(text: string, size: number, maximumWidth: number, weight?: Weight): string[] {
  const lines = greedyWrap(text, size, maximumWidth, weight);
  if (lines.length < 2) return lines;
  let low = 0;
  let high = maximumWidth;
  let best = lines;
  while (high - low > 1) {
    const width = (low + high) / 2;
    const candidate = greedyWrap(text, size, width, weight);
    if (candidate.length === lines.length && candidate.every((line) => measureVectorText(line, size, weight) <= width)) {
      best = candidate;
      high = width;
    } else {
      low = width;
    }
  }
  return best;
}

function greedyWrap(text: string, size: number, maximumWidth: number, weight?: Weight): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measureVectorText(candidate, size, weight) > maximumWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Text converted to vector paths, so generated assets need no installed fonts. */
export function vectorText(text: string, options: VectorTextOptions): VectorText {
  const font = fontFor(options.weight);
  const run = font.layout(text);
  const scale = options.size / font.unitsPerEm;
  const letterSpacing = options.letterSpacing ?? 0;
  const width = measureVectorText(text, options.size, options.weight, letterSpacing);
  const anchorOffset = options.anchor === "middle" ? width / 2 : options.anchor === "end" ? width : 0;
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
    svg: `<g fill="${options.fill}" aria-label="${escapeXml(text)}">${paths.join("")}</g>`,
  };
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
