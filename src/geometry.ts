import type { Glyph, MarkPaths } from "./model.js";
import { grammar } from "./tokens.js";

/**
 * The stave grammar. Every mark is built from straight strokes only: vertical
 * staves and diagonal twigs, the way runes were cut across the grain. There
 * are no curves and no horizontal strokes. Staves are carved in ink; twigs
 * are filled with paint. Strokes end flat against a shared band, like an
 * inscription between two cut lines.
 *
 * Geometry is emitted as filled, convex outlines rather than SVG strokes, so
 * a mark renders identically inline, as a file, and in raster exports.
 */

type Kind = "ink" | "paint";
type Point = readonly [number, number];
type Stroke = {
  points: readonly Point[];
  kinds: readonly Kind[];
  closed?: boolean;
};

const ink = "ink";
const paint = "paint";

function line(points: Point[], kinds: Kind | Kind[], closed = false): Stroke {
  const segments = closed ? points.length : points.length - 1;
  return {
    points,
    kinds: Array.isArray(kinds) ? kinds : Array.from({ length: segments }, () => kinds),
    closed,
  };
}

/** Optical spacing after a letter, added to the shared gap. */
const kerning: Record<string, number> = { R: -9, U: -2, N: -2, I: -2 };

/** Wordmark letters on a 100-unit cap height. Only the crossing of the N is painted. */
const letters: Record<string, Stroke[]> = {
  R: [line([[0, 0], [0, 100]], ink), line([[0, 0], [54, 25], [0, 50]], ink), line([[0, 50], [54, 100]], ink)],
  U: [line([[0, 0], [0, 70], [28, 100], [56, 70], [56, 0]], ink)],
  N: [line([[0, 100], [0, 0], [56, 100], [56, 0]], [ink, paint, ink])],
  I: [line([[0, 0], [0, 100]], ink)],
  C: [line([[50, 0], [0, 28], [0, 72], [50, 100]], ink)],
};

/** Product glyphs in a 100-unit box. Staves are ink, twigs are paint. */
const glyphStrokes: Record<Glyph, Stroke[]> = {
  // The R of the wordmark: one stave, a pointed bowl and a leg.
  runic: [
    line([[36, 6], [36, 94]], ink),
    line([[36, 6], [70, 26], [36, 48]], paint),
    line([[36, 48], [72, 94]], paint),
  ],
  // Two sides, .NET and the frontend, bound by typed crossings.
  application: [
    line([[22, 6], [22, 94]], ink),
    line([[78, 6], [78, 94]], ink),
    line([[22, 20], [78, 80]], paint),
    line([[22, 80], [78, 20]], paint),
  ],
  // A native window frame.
  desktop: [
    line(
      [[18, 30], [50, 13], [82, 30], [82, 70], [50, 87], [18, 70]],
      [paint, paint, ink, paint, paint, ink],
      true,
    ),
  ],
  // Fehu, the rune of property: what an application owns and ships.
  assets: [
    line([[30, 6], [30, 94]], ink),
    line([[30, 42], [74, 14]], paint),
    line([[30, 72], [74, 44]], paint),
  ],
  // One message passed between two languages.
  translations: [
    line([[46, 10], [18, 34], [46, 58]], paint),
    line([[54, 42], [82, 66], [54, 90]], paint),
  ],
  // A prompt and a cursor.
  "command-line": [line([[78, 16], [78, 84]], ink), line([[14, 16], [48, 50], [14, 84]], paint)],
  // Markup brackets around a binding.
  webui: [
    line([[50, 10], [50, 90]], ink),
    line([[32, 20], [8, 50], [32, 80]], paint),
    line([[68, 20], [92, 50], [68, 80]], paint),
  ],
  // Three strokes moving forward. Runic Flow is retired.
  flow: [
    line([[14, 84], [38, 16]], paint),
    line([[38, 84], [62, 16]], paint),
    line([[62, 84], [86, 16]], paint),
  ],
};

type Polygon = Point[];
type Shape = { kind: Kind; polygon: Polygon };

const miterLimit = 10;

function outline(stroke: Stroke, width: number): Shape[] {
  const half = width / 2;
  const { points, kinds, closed } = stroke;
  const count = points.length;
  const segments = closed ? count : count - 1;
  const shapes: Shape[] = [];
  const direction = (index: number): Point => {
    const [ax, ay] = points[index % count];
    const [bx, by] = points[(index + 1) % count];
    const length = Math.hypot(bx - ax, by - ay);
    return [(bx - ax) / length, (by - ay) / length];
  };

  for (let index = 0; index < segments; index += 1) {
    const [ax, ay] = points[index];
    const [bx, by] = points[(index + 1) % count];
    const [ux, uy] = direction(index);
    const nx = -uy * half;
    const ny = ux * half;
    shapes.push({
      kind: kinds[index],
      polygon: [
        [ax + nx, ay + ny],
        [bx + nx, by + ny],
        [bx - nx, by - ny],
        [ax - nx, ay - ny],
      ],
    });
  }

  const joints = closed ? count : count - 2;
  for (let offset = 0; offset < joints; offset += 1) {
    const incoming = closed ? (offset + count - 1) % count : offset;
    const outgoing = closed ? offset : offset + 1;
    const [px, py] = points[outgoing % count];
    const [u1x, u1y] = direction(incoming);
    const [u2x, u2y] = direction(outgoing);
    const cross = u1x * u2y - u1y * u2x;
    if (Math.abs(cross) < 1e-9) continue;
    const sign = Math.sign(cross);
    // Outer normals of the turn.
    const o1: Point = [sign * u1y, -sign * u1x];
    const o2: Point = [sign * u2y, -sign * u2x];
    const sx = o1[0] + o2[0];
    const sy = o1[1] + o2[1];
    const squared = sx * sx + sy * sy;
    const first: Point = [px + o1[0] * half, py + o1[1] * half];
    const second: Point = [px + o2[0] * half, py + o2[1] * half];
    const ratio = 2 / Math.sqrt(squared);
    // Where a twig turns into a stave, the corner belongs to the twig, so the
    // stave keeps its plain rectangular cut.
    const kind = kinds[incoming] === kinds[outgoing] ? kinds[incoming] : paint;
    const polygon: Polygon =
      ratio <= miterLimit
        ? [[px, py], first, [px + (sx * 2 * half) / squared, py + (sy * 2 * half) / squared], second]
        : [[px, py], first, second];
    shapes.push({ kind, polygon });
  }
  return shapes;
}

function clipBelow(polygon: Polygon, limit: number, keepAbove: boolean): Polygon {
  const inside = (point: Point) => (keepAbove ? point[1] <= limit : point[1] >= limit);
  const result: Point[] = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentInside = inside(current);
    const previousInside = inside(previous);
    if (currentInside !== previousInside) {
      const t = (limit - previous[1]) / (current[1] - previous[1]);
      result.push([previous[0] + t * (current[0] - previous[0]), limit]);
    }
    if (currentInside) result.push(current);
  }
  return result;
}

function clipToBand(polygon: Polygon, top: number, bottom: number): Polygon {
  return clipBelow(clipBelow(polygon, top, false), bottom, true);
}

function number(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return (Object.is(rounded, -0) ? 0 : rounded).toString();
}

function pathData(shapes: Shape[], kind: Kind, dx: number): string {
  return shapes
    .filter((shape) => shape.kind === kind && shape.polygon.length >= 3)
    .map(
      (shape) =>
        `M${shape.polygon.map(([x, y]) => `${number(x + dx)} ${number(y)}`).join("L")}Z`,
    )
    .join("");
}

/**
 * Moves an open stroke's ends that touch the band past it, so clipping cuts
 * them flat along the band instead of leaving a slanted butt end.
 */
function extendToBand(stroke: Stroke, others: Stroke[], width: number, top: number, bottom: number): Stroke {
  if (stroke.closed || stroke.points.length < 2) return stroke;
  const points = [...stroke.points];
  const joined = ([x, y]: Point) =>
    others.some((other) => other !== stroke && other.points.some(([ox, oy]) => ox === x && oy === y));
  const extend = (end: number, neighbour: number) => {
    const [x, y] = points[end];
    if (y > top + 1e-6 && y < bottom - 1e-6) return;
    // An end that meets another stroke stays put; that stroke covers it.
    if (joined(points[end])) return;
    const [nx, ny] = points[neighbour];
    const length = Math.hypot(x - nx, y - ny);
    points[end] = [x + ((x - nx) / length) * width, y + ((y - ny) / length) * width];
  };
  extend(0, 1);
  extend(points.length - 1, points.length - 2);
  return { ...stroke, points };
}

function build(strokes: Stroke[], width: number, top: number, bottom: number): Shape[] {
  return strokes
    .map((stroke) => extendToBand(stroke, strokes, width, top, bottom))
    .flatMap((stroke) => outline(stroke, width))
    .map((shape) => ({ ...shape, polygon: clipToBand(shape.polygon, top, bottom) }))
    .filter((shape) => shape.polygon.length >= 3);
}

function horizontalBounds(shapes: Shape[]): [number, number] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const { polygon } of shapes) {
    for (const [x] of polygon) {
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
  }
  return [min, max];
}

/** The RUNIC wordmark, filled outlines on a 100-unit cap height. */
export function wordmark(): MarkPaths {
  const { capHeight, wordmarkStave, wordmarkGap } = grammar;
  const shapes: Shape[] = [];
  let cursor = 0;
  for (const letter of "RUNIC") {
    const letterShapes = build(letters[letter], wordmarkStave, 0, capHeight);
    const [min, max] = horizontalBounds(letterShapes);
    const dx = cursor - min;
    for (const shape of letterShapes) {
      shapes.push({ ...shape, polygon: shape.polygon.map(([x, y]) => [x + dx, y] as Point) });
    }
    cursor += max - min + wordmarkGap + (kerning[letter] ?? 0);
  }
  const width = cursor - wordmarkGap - (kerning.C ?? 0);
  return {
    width: Number(number(width)),
    height: capHeight,
    ink: pathData(shapes, ink, 0),
    paint: pathData(shapes, paint, 0),
  };
}

/** A product glyph centred in a 100-unit box. */
export function glyph(name: Glyph): MarkPaths {
  const { glyphStave, glyphBand } = grammar;
  const shapes = build(glyphStrokes[name], glyphStave, glyphBand.top, glyphBand.bottom);
  const [min, max] = horizontalBounds(shapes);
  const dx = 50 - (min + max) / 2;
  return { width: 100, height: 100, ink: pathData(shapes, ink, dx), paint: pathData(shapes, paint, dx) };
}

export type MarkColors = { ink: string; paint: string };

/** Paths for a mark, as an SVG group positioned with a transform. */
export function markGroup(
  paths: MarkPaths,
  colors: MarkColors,
  transform: { x: number; y: number; scale: number },
): string {
  const { x, y, scale } = transform;
  return `<g transform="translate(${number(x)} ${number(y)}) scale(${number(scale)})">${fills(paths, colors)}</g>`;
}

function fills(paths: MarkPaths, colors: MarkColors): string {
  return [
    paths.paint ? `<path fill="${colors.paint}" d="${paths.paint}"/>` : "",
    paths.ink ? `<path fill="${colors.ink}" d="${paths.ink}"/>` : "",
  ].join("");
}

/** A standalone SVG of a mark. Use `currentColor` for ink to inherit text colour. */
export function markSvg(paths: MarkPaths, colors: MarkColors, title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${paths.width} ${paths.height}" role="img" aria-label="${title}">${fills(paths, colors)}</svg>\n`;
}
