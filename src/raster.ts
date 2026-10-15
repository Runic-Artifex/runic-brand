import sharp from "sharp";

/** Rasterizes a generated SVG at its own dimensions, or an integer multiple of them. */
export async function rasterizeBrandSvg(svg: string, width: number, height: number, scale = 1): Promise<Buffer> {
  if (!Number.isInteger(scale) || scale < 1 || scale > 4) {
    throw new Error("Raster scale must be an integer from 1 through 4.");
  }
  return sharp(Buffer.from(svg), { density: 72 * scale })
    .resize(width * scale, height * scale, { fit: "fill" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}
