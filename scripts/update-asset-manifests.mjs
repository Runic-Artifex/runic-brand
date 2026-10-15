import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { canonicalMatrix, loadBrand, matrixPaths } from "./asset-matrix.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const matrixPath = resolve(root, "assets/brand-asset-matrix.json");
const inventoryPath = resolve(root, "assets/asset-inventory.json");
const goldensPath = resolve(root, "assets/visual-goldens.json");
const digest = (value) => createHash("sha256").update(value).digest("hex");

const matrix = canonicalMatrix(await loadBrand());
const assets = {};
const pixels = Object.fromEntries(Object.keys(matrix.profiles).map((profile) => [profile, []]));

for (const logicalPath of matrixPaths(matrix)) {
  const bytes = await readFile(resolve(root, "assets/generated", logicalPath));
  const [identity, profile] = logicalPath.split("/");
  if (identity === "web") {
    assets[logicalPath] = { profile: "web", sha256: digest(bytes) };
    continue;
  }
  const expected = matrix.profiles[profile];
  const metadata = await sharp(bytes).metadata();
  if (metadata.width !== expected.width || metadata.height !== expected.height) {
    throw new Error(`${logicalPath} has unexpected dimensions`);
  }
  assets[logicalPath] = { profile, sha256: digest(bytes) };
}

// Goldens are indexed by the identity order of the matrix.
for (const identity of matrix.identities) {
  for (const profile of Object.keys(matrix.profiles)) {
    const bytes = await readFile(resolve(root, "assets/generated", identity, profile));
    pixels[profile].push(digest(await sharp(bytes).ensureAlpha().raw().toBuffer()));
  }
}

const inventory = {
  schemaVersion: 2,
  license: "MIT",
  source: {
    kind: "canonical-brand-artwork",
    reference: "https://github.com/Runic-Artifex/runic-brand",
  },
  assets,
};
const goldens = { schemaVersion: 1, renderer: sharp.versions, pixels };
await writeFile(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);
await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
await writeFile(goldensPath, `${JSON.stringify(goldens, null, 2)}\n`);
console.log(`Updated the asset matrix, ${Object.keys(assets).length} inventory entries and visual goldens.`);
