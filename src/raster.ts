import sharp from "sharp";

export type MaterializeOptions = {
  scale?: number;
};

/**
 * Turns the transparent vector construction into the canonical material
 * artwork. Vectors define the mask; this stage supplies stone, relief and
 * directional metal light at export resolution.
 */
export async function materializeBrandPng(
  overlaySvg: string,
  width: number,
  height: number,
  seed: number,
  options: MaterializeOptions = {},
): Promise<Buffer> {
  const scale = options.scale ?? 1;
  if (!Number.isInteger(scale) || scale < 1 || scale > 4) {
    throw new Error("Material scale must be an integer from 1 through 4.");
  }
  const outputWidth = width * scale;
  const outputHeight = height * scale;
  const stone = stoneSurface(outputWidth, outputHeight, seed);
  const overlay = await sharp(Buffer.from(overlaySvg), { density: 144 * scale })
    .resize(outputWidth, outputHeight, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();
  weatherMetal(overlay, outputWidth, outputHeight, seed);
  const { highlight, shade, recess } = reliefLayers(overlay, outputWidth, outputHeight, scale);

  return sharp(stone, { raw: { width: outputWidth, height: outputHeight, channels: 4 } })
    .composite([
      { input: recess, raw: { width: outputWidth, height: outputHeight, channels: 4 } },
      { input: overlay, raw: { width: outputWidth, height: outputHeight, channels: 4 } },
      { input: highlight, raw: { width: outputWidth, height: outputHeight, channels: 4 }, blend: "screen" },
      { input: shade, raw: { width: outputWidth, height: outputHeight, channels: 4 }, blend: "multiply" },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

function weatherMetal(overlay: Buffer, width: number, height: number, seed: number): void {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (overlay[offset + 3] === 0) continue;
      const broadWear = valueNoise(x, y, Math.max(8, Math.round(width / 90)), seed + 41);
      const fineWear = hash(x, y, seed + 73);
      const luminance = 0.88 + broadWear * 0.14 + fineWear * 0.025;
      overlay[offset] = channel(overlay[offset] * luminance);
      overlay[offset + 1] = channel(overlay[offset + 1] * luminance);
      overlay[offset + 2] = channel(overlay[offset + 2] * luminance);
    }
  }
}

function stoneSurface(width: number, height: number, seed: number): Buffer {
  const pixels = Buffer.allocUnsafe(width * height * 4);
  const phase = seed * 0.037;
  const scale = Math.max(1, Math.round(width / 1200));

  for (let y = 0; y < height; y += 1) {
    const normalizedY = y / height - 0.5;
    for (let x = 0; x < width; x += 1) {
      const normalizedX = x / width - 0.5;
      const broad =
        (valueNoise(x, y, 180 * scale, seed + 3) - 0.5) * 1.05 +
        (valueNoise(x, y, 67 * scale, seed + 11) - 0.5) * 0.46 +
        (valueNoise(x, y, 23 * scale, seed + 29) - 0.5) * 0.17;
      const mineral = valueNoise(x + broad * 90, y - broad * 55, 92 * scale, seed + 67);
      const vein = Math.max(0, 0.035 - Math.abs(mineral - 0.52)) * 43;
      const grain = hash(x, y, seed) - 0.5;
      const fibers = Math.sin(y * 0.31 + Math.sin(x * 0.012 + phase) * 2.1) * 0.75;
      const vignette = Math.min(1, Math.sqrt(normalizedX ** 2 * 1.4 + normalizedY ** 2) * 1.08);
      const directional = (1 - x / width) * 1.7 + (1 - y / height) * 1.1;
      const light = broad * 18 + grain * 5.8 + fibers * 0.72 + directional - vignette * 5.1 - vein;
      const offset = (y * width + x) * 4;
      pixels[offset] = channel(10 + light * 0.68);
      pixels[offset + 1] = channel(20 + light);
      pixels[offset + 2] = channel(14 + light * 0.74);
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

function reliefLayers(
  overlay: Buffer,
  width: number,
  height: number,
  scale: number,
): { highlight: Buffer; shade: Buffer; recess: Buffer } {
  const highlight = Buffer.alloc(width * height * 4);
  const shade = Buffer.alloc(width * height * 4);
  const recess = Buffer.alloc(width * height * 4);
  const step = Math.max(1, scale);
  const alphaAt = (x: number, y: number): number => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    return overlay[(y * width + x) * 4 + 3];
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = alphaAt(x, y);
      const upperLeft = alphaAt(x - step, y - step);
      const lowerRight = alphaAt(x + step, y + step);
      const raisedLight = Math.max(0, alpha - upperLeft);
      const raisedShade = Math.max(0, alpha - lowerRight);
      const cutShadow = Math.max(0, upperLeft - alpha);

      highlight[offset] = 255;
      highlight[offset + 1] = 233;
      highlight[offset + 2] = 172;
      highlight[offset + 3] = Math.round(raisedLight * 0.62);

      shade[offset] = 42;
      shade[offset + 1] = 27;
      shade[offset + 2] = 11;
      shade[offset + 3] = Math.round(raisedShade * 0.52);

      recess[offset] = 0;
      recess[offset + 1] = 0;
      recess[offset + 2] = 0;
      recess[offset + 3] = Math.round(cutShadow * 0.72);
    }
  }
  return { highlight, shade, recess };
}

function hash(x: number, y: number, seed: number): number {
  let value = (Math.imul(x + seed * 17, 374761393) + Math.imul(y + seed * 29, 668265263)) | 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number, cell: number, seed: number): number {
  const px = x / cell;
  const py = y / cell;
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const fx = smooth(px - x0);
  const fy = smooth(py - y0);
  const top = mix(hash(x0, y0, seed), hash(x0 + 1, y0, seed), fx);
  const bottom = mix(hash(x0, y0 + 1, seed), hash(x0 + 1, y0 + 1, seed), fx);
  return mix(top, bottom, fy);
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value);
}

function mix(left: number, right: number, amount: number): number {
  return left + (right - left) * amount;
}

function channel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
