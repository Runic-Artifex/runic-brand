import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { canonicalMatrix, extensionOf, loadBrand, matrixPaths, mediaTypes } from "./asset-matrix.mjs";
import { validateSvgDocument } from "./svg-security.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const assetRoot = resolve(root, "assets/generated");
const inventoryPath = resolve(root, "assets/asset-inventory.json");
const goldensPath = resolve(root, "assets/visual-goldens.json");
const matrixPath = resolve(root, "assets/brand-asset-matrix.json");
const maxRasterPixels = 2_000_000;
const byteLimits = new Map([
  [".png", 5_000_000],
  [".svg", 1_000_000],
  [".json", 1_000_000],
  [".css", 64_000],
]);
const pathDataPattern = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\se+-]*$/u;
const regenerateHint = "run npm run update:manifests after an intended change.";

const failures = [];
const digest = (value) => createHash("sha256").update(value).digest("hex");
const fail = (message) => failures.push(message);

async function collectFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const logicalPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, logicalPath)));
    } else if (entry.isFile()) {
      files.push(logicalPath);
    } else {
      fail(`assets/generated/${logicalPath}: only regular files are allowed.`);
    }
  }
  return files.sort();
}

function readJson(path, label) {
  return readFile(path, "utf8")
    .then((content) => JSON.parse(content))
    .catch((error) => {
      fail(`${label}: ${error.message}`);
      return null;
    });
}

function validateLogicalPath(logicalPath, label) {
  if (typeof logicalPath !== "string" || !logicalPath || logicalPath.includes("\\") || logicalPath.startsWith("/") || logicalPath.includes("..")) {
    fail(`${label}: logicalPath must be a relative POSIX path without traversal.`);
    return false;
  }
  const extension = extensionOf(logicalPath);
  if (!mediaTypes.has(extension)) {
    fail(`${label}: unsupported asset extension ${extension || "(none)"}.`);
    return false;
  }
  return true;
}

function pathKey(path) {
  return path.normalize("NFC").toLocaleLowerCase("en-US");
}

function validateSourceMetadata(inventory) {
  if (inventory.license !== "MIT") {
    fail("assets/asset-inventory.json: license must match LICENSE (MIT).");
  }
  if (!inventory.source || typeof inventory.source !== "object" || Array.isArray(inventory.source)) {
    fail("assets/asset-inventory.json: source metadata is required.");
    return;
  }
  if (inventory.source.kind !== "canonical-brand-artwork" || inventory.source.reference !== "https://github.com/Runic-Artifex/runic-brand") {
    fail("assets/asset-inventory.json: source metadata must name the canonical repository authority.");
  }
}

/** Reads an inventoried file within its byte limit and checks its digest. */
async function readAsset(asset, label) {
  if (typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.sha256)) fail(`${label}: sha256 must be a lowercase SHA-256 digest.`);
  const absolutePath = resolve(assetRoot, ...asset.logicalPath.split("/"));
  if (!absolutePath.startsWith(`${assetRoot}${sep}`)) {
    fail(`${label}: resolves outside assets/generated.`);
    return null;
  }
  try {
    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) fail(`${label}: is not a regular file.`);
    const byteLimit = byteLimits.get(extensionOf(asset.logicalPath));
    if (fileStat.size > byteLimit) {
      fail(`${label}: exceeds the ${byteLimit}-byte input limit.`);
      return null;
    }
    const bytes = await readFile(absolutePath);
    if (digest(bytes) !== asset.sha256) fail(`${label}: SHA-256 does not match the inventory; ${regenerateHint}`);
    return bytes;
  } catch {
    fail(`${label}: is missing.`);
    return null;
  }
}

/** Decodes an image with safety limits and returns its metadata and pixels. */
async function decodeImage(bytes, extension, label) {
  try {
    const image = sharp(bytes, { animated: false, limitInputPixels: maxRasterPixels });
    const metadata = await image.metadata();
    if (metadata.format !== (extension === ".png" ? "png" : "svg")) fail(`${label}: detected format is ${metadata.format ?? "unknown"}.`);
    if ((metadata.pages ?? 1) !== 1) fail(`${label}: animated or multi-page images are not allowed.`);
    if ((metadata.width ?? 0) * (metadata.height ?? 0) > maxRasterPixels) fail(`${label}: exceeds the raster pixel safety limit.`);
    return { metadata, pixels: await image.ensureAlpha().raw().toBuffer() };
  } catch (error) {
    fail(`${label}: cannot be safely decoded (${error.message}).`);
    return null;
  }
}

async function inspectIdentityAsset(asset, profiles, golden) {
  const label = `assets/generated/${asset.logicalPath}`;
  const profile = profiles[asset.profile];
  if (!profile || !Number.isInteger(profile.width) || !Number.isInteger(profile.height) || profile.width <= 0 || profile.height <= 0) {
    fail(`${label}: profile ${asset.profile ?? "(missing)"} must define positive integer dimensions.`);
    return;
  }
  if (asset.logicalPath.split("/")[1] !== asset.profile) fail(`${label}: profile ${asset.profile} does not match the file name.`);
  const bytes = await readAsset(asset, label);
  if (!bytes) return;

  const extension = extensionOf(asset.logicalPath);
  if (profile.mediaType !== mediaTypes.get(extension)) fail(`${label}: profile ${asset.profile} must declare ${mediaTypes.get(extension)}.`);
  if (extension === ".svg") failures.push(...validateSvgDocument(bytes.toString("utf8"), label));

  const decoded = await decodeImage(bytes, extension, label);
  if (!decoded) return;
  if (decoded.metadata.width !== profile.width || decoded.metadata.height !== profile.height) fail(`${label}: dimensions do not match profile ${asset.profile}.`);
  if (!golden || golden !== digest(decoded.pixels)) fail(`${label}: visual golden does not match pinned sharp rendering; ${regenerateHint}`);
}

function validateMark(mark, label) {
  if (!mark || typeof mark !== "object" || Array.isArray(mark)) {
    fail(`${label}: must be an object.`);
    return;
  }
  for (const key of ["width", "height"]) {
    if (typeof mark[key] !== "number" || !Number.isFinite(mark[key]) || mark[key] <= 0) fail(`${label}.${key} must be a positive number.`);
  }
  for (const key of ["ink", "paint"]) {
    if (typeof mark[key] !== "string" || !pathDataPattern.test(mark[key])) fail(`${label}.${key} must be SVG path data.`);
  }
  if (typeof mark.ink === "string" && typeof mark.paint === "string" && !`${mark.ink}${mark.paint}`.trim()) fail(`${label}: has no path data.`);
}

function validateMarkData(text, label, brand) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    fail(`${label}: is not valid JSON (${error.message}).`);
    return;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    fail(`${label}: must be a JSON object.`);
    return;
  }
  validateMark(data.wordmark, `${label} wordmark`);
  if (!data.glyphs || typeof data.glyphs !== "object" || Array.isArray(data.glyphs)) {
    fail(`${label}: glyphs must be an object.`);
    return;
  }
  if (JSON.stringify(Object.keys(data.glyphs)) !== JSON.stringify([...brand.glyphs])) fail(`${label}: glyphs must match the library glyph list.`);
  for (const [name, mark] of Object.entries(data.glyphs)) validateMark(mark, `${label} glyphs.${name}`);
}

function validateTokens(text, label) {
  if (!text.includes("--rune-paint:")) fail(`${label}: must define --rune-paint.`);
  const normalized = text.toLowerCase();
  if (normalized.includes("@import")) fail(`${label}: must not import other stylesheets.`);
  if (normalized.includes("url(")) fail(`${label}: must not reference URLs.`);
  if (normalized.includes("<")) fail(`${label}: must not contain markup.`);
}

async function inspectWebAsset(asset, web, brand) {
  const label = `assets/generated/${asset.logicalPath}`;
  const entry = web[asset.logicalPath];
  if (asset.profile !== "web" || !entry) {
    fail(`${label}: web assets must use the web profile and be listed in the matrix.`);
    return;
  }
  const extension = extensionOf(asset.logicalPath);
  if (entry.mediaType !== mediaTypes.get(extension)) fail(`${label}: must declare ${mediaTypes.get(extension)}.`);
  const bytes = await readAsset(asset, label);
  if (!bytes) return;
  const text = bytes.toString("utf8");
  if (extension === ".svg") {
    failures.push(...validateSvgDocument(text, label));
    await decodeImage(bytes, extension, label);
  } else if (extension === ".json") {
    validateMarkData(text, label, brand);
  } else if (extension === ".css") {
    validateTokens(text, label);
  } else {
    fail(`${label}: unsupported web asset type.`);
  }
}

const [inventory, goldens, matrix, packageJson] = await Promise.all([
  readJson(inventoryPath, "assets/asset-inventory.json"),
  readJson(goldensPath, "assets/visual-goldens.json"),
  readJson(matrixPath, "assets/brand-asset-matrix.json"),
  readJson(resolve(root, "package.json"), "package.json"),
]);
const brand = await loadBrand().catch((error) => {
  fail(error.message);
  return null;
});

if (inventory && goldens && matrix && packageJson && brand) {
  const expectedSharpVersion = packageJson.dependencies?.sharp;
  if (inventory.schemaVersion !== 2 || !inventory.assets || typeof inventory.assets !== "object" || Array.isArray(inventory.assets)) fail("assets/asset-inventory.json: expected schemaVersion 2 and an assets object.");
  if (matrix.schemaVersion !== 2 || !Array.isArray(matrix.identities) || !matrix.profiles || typeof matrix.profiles !== "object" || !matrix.web || typeof matrix.web !== "object") fail("assets/brand-asset-matrix.json: expected schemaVersion 2, identities, profiles, and web.");
  if (JSON.stringify(matrix) !== JSON.stringify(canonicalMatrix(brand))) fail(`assets/brand-asset-matrix.json: does not match the identities, formats and web exports of the library; ${regenerateHint}`);
  if (goldens.schemaVersion !== 1 || goldens.renderer?.sharp !== expectedSharpVersion || !goldens.pixels || typeof goldens.pixels !== "object" || Array.isArray(goldens.pixels)) fail(`assets/visual-goldens.json: expected schemaVersion 1, sharp ${expectedSharpVersion}, renderer versions, and profile pixel goldens.`);
  if (sharp.versions?.sharp !== expectedSharpVersion) fail(`Installed sharp ${sharp.versions?.sharp ?? "unknown"} does not match pinned renderer ${expectedSharpVersion}.`);
  if (JSON.stringify(goldens.renderer) !== JSON.stringify(sharp.versions)) fail("Installed sharp renderer components do not match the pinned visual-golden toolchain.");

  validateSourceMetadata(inventory);
  const assets = Object.entries(inventory.assets ?? {}).map(([logicalPath, entry]) => ({ logicalPath, ...(entry ?? {}) }));
  const actualFiles = await collectFiles(assetRoot);
  const inventoryPaths = assets.map((asset) => asset.logicalPath);
  const duplicate = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
  for (const path of duplicate(inventoryPaths)) fail(`assets/asset-inventory.json: duplicate logical path ${path}.`);
  for (const path of inventoryPaths.filter((path) => path !== path.normalize("NFC"))) fail(`assets/asset-inventory.json: logical path ${path} is not NFC-normalized.`);
  for (const path of actualFiles.filter((path) => path !== path.normalize("NFC"))) fail(`assets/generated: file path ${path} is not NFC-normalized.`);
  for (const path of duplicate(inventoryPaths.map((path) => typeof path === "string" ? pathKey(path) : path))) fail(`assets/asset-inventory.json: Unicode/case-colliding logical path ${path}.`);
  for (const path of duplicate(actualFiles.map(pathKey))) fail(`assets/generated: Unicode/case-colliding file path ${path}.`);
  for (const path of inventoryPaths.filter((path) => !actualFiles.includes(path))) fail(`assets/generated/${path}: listed in inventory but missing.`);
  for (const path of actualFiles.filter((path) => !inventoryPaths.includes(path))) fail(`assets/generated/${path}: not listed in the closed inventory.`);
  const expectedPaths = matrixPaths(matrix);
  for (const path of expectedPaths.filter((path) => !inventoryPaths.includes(path))) fail(`assets/asset-inventory.json: required matrix asset ${path} is missing.`);
  for (const path of inventoryPaths.filter((path) => !expectedPaths.includes(path))) fail(`assets/asset-inventory.json: ${path} is outside the canonical matrix.`);
  if (new Set(matrix.identities).size !== matrix.identities.length) fail("assets/brand-asset-matrix.json: identity IDs must be unique.");
  for (const profile of Object.keys(matrix.profiles)) if (!Array.isArray(goldens.pixels?.[profile]) || goldens.pixels[profile].length !== matrix.identities.length) fail(`assets/visual-goldens.json: ${profile} must contain one golden for each canonical identity.`);
  for (const profile of Object.keys(goldens.pixels ?? {})) if (!(profile in matrix.profiles)) fail(`assets/visual-goldens.json: ${profile} is outside the canonical matrix.`);
  for (const asset of assets) {
    const label = `assets/generated/${asset.logicalPath}`;
    if (!validateLogicalPath(asset.logicalPath, label)) continue;
    const [identity] = asset.logicalPath.split("/");
    if (identity === "web") {
      await inspectWebAsset(asset, matrix.web, brand);
    } else {
      const identityIndex = matrix.identities.indexOf(identity);
      if (identityIndex < 0) fail(`${label}: ${identity} is not a canonical identity.`);
      await inspectIdentityAsset(asset, matrix.profiles, goldens.pixels?.[asset.profile]?.[identityIndex]);
    }
  }
} else {
  fail("cannot verify brand assets without the manifests, package.json and dist/index.js.");
}

if (failures.length) {
  for (const failure of failures) console.error(`brand asset verification failed: ${failure}`);
  process.exitCode = 1;
} else if (!process.argv.includes("--quiet")) {
  const webCount = Object.keys(matrix.web).length;
  console.log(`brand asset verification passed: ${Object.keys(inventory.assets).length} immutable assets (${webCount} web exports) and ${Object.values(goldens.pixels).flat().length} visual goldens.`);
}
