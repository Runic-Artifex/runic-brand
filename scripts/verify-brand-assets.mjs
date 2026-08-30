import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { validateSvgDocument } from "./svg-security.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const assetRoot = resolve(root, "assets/generated");
const inventoryPath = resolve(root, "assets/asset-inventory.json");
const goldensPath = resolve(root, "assets/visual-goldens.json");
const matrixPath = resolve(root, "assets/brand-asset-matrix.json");
const expectedSharpVersion = "0.35.3";
const maxRasterPixels = 2_000_000;
const maxRasterBytes = 5_000_000;
const maxSvgBytes = 1_000_000;
const requiredIdentities = ["cs-webui", "runic-artifex", "runic-assets", "runic-command-line", "runic-desktop", "runic-docs", "runic-flow", "runic-toolkit", "runic-translations", "runic-translations-editor"];
const requiredProfiles = ["banner.png", "banner.svg", "icon.png", "icon.svg", "social-overlay.svg", "social.png", "social.svg"];
const allowedExtensions = new Map([
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

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
  const extension = logicalPath.slice(logicalPath.lastIndexOf("."));
  if (!allowedExtensions.has(extension)) {
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

async function inspectAsset(asset, profiles, golden) {
  const label = `assets/generated/${asset.logicalPath}`;
  if (!validateLogicalPath(asset.logicalPath, label)) return;
  if (typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.sha256)) fail(`${label}: sha256 must be a lowercase SHA-256 digest.`);
  const profile = profiles[asset.profile];
  if (!profile || !Number.isInteger(profile.width) || !Number.isInteger(profile.height) || profile.width <= 0 || profile.height <= 0) {
    fail(`${label}: profile ${asset.profile ?? "(missing)"} must define positive integer dimensions.`);
    return;
  }

  const absolutePath = resolve(assetRoot, ...asset.logicalPath.split("/"));
  if (!absolutePath.startsWith(`${assetRoot}${sep}`)) {
    fail(`${label}: resolves outside assets/generated.`);
    return;
  }
  let bytes;
  try {
    const fileStat = await stat(absolutePath);
    if (!fileStat.isFile()) fail(`${label}: is not a regular file.`);
    const byteLimit = asset.logicalPath.endsWith(".svg") ? maxSvgBytes : maxRasterBytes;
    if (fileStat.size > byteLimit) {
      fail(`${label}: exceeds the ${byteLimit}-byte input limit.`);
      return;
    }
    bytes = await readFile(absolutePath);
  } catch {
    fail(`${label}: is missing.`);
    return;
  }
  if (digest(bytes) !== asset.sha256) fail(`${label}: SHA-256 does not match the inventory.`);

  const extension = asset.logicalPath.slice(asset.logicalPath.lastIndexOf("."));
  const mediaType = allowedExtensions.get(extension);
  if (profile.mediaType !== mediaType) fail(`${label}: profile ${asset.profile} must declare ${mediaType}.`);
  if (extension === ".svg") failures.push(...validateSvgDocument(bytes.toString("utf8"), label));

  try {
    const image = sharp(bytes, { animated: false, limitInputPixels: maxRasterPixels });
    const metadata = await image.metadata();
    if (metadata.format !== (extension === ".png" ? "png" : "svg")) fail(`${label}: detected format is ${metadata.format ?? "unknown"}.`);
    if (metadata.width !== profile.width || metadata.height !== profile.height) fail(`${label}: dimensions do not match profile ${asset.profile}.`);
    if ((metadata.pages ?? 1) !== 1) fail(`${label}: animated or multi-page images are not allowed.`);
    if ((metadata.width ?? 0) * (metadata.height ?? 0) > maxRasterPixels) fail(`${label}: exceeds the raster pixel safety limit.`);
    const pixels = await image.ensureAlpha().raw().toBuffer();
    if (!golden || golden !== digest(pixels)) {
      fail(`${label}: visual golden does not match pinned sharp rendering.`);
    }
  } catch (error) {
    fail(`${label}: cannot be safely decoded (${error.message}).`);
  }
}

const [inventory, goldens, matrix] = await Promise.all([
  readJson(inventoryPath, "assets/asset-inventory.json"),
  readJson(goldensPath, "assets/visual-goldens.json"),
  readJson(matrixPath, "assets/brand-asset-matrix.json"),
]);

if (!inventory || !goldens || !matrix) process.exitCode = 1;
else {
  if (inventory.schemaVersion !== 1 || !inventory.assets || typeof inventory.assets !== "object" || Array.isArray(inventory.assets)) fail("assets/asset-inventory.json: expected schemaVersion 1 and an assets object.");
  if (matrix.schemaVersion !== 1 || !Array.isArray(matrix.identities) || !matrix.profiles || typeof matrix.profiles !== "object") fail("assets/brand-asset-matrix.json: expected schemaVersion 1, identities, and profiles.");
  if (JSON.stringify(matrix.identities) !== JSON.stringify(requiredIdentities)) fail("assets/brand-asset-matrix.json: identities must match the canonical 10-identity matrix and order.");
  if (JSON.stringify(Object.keys(matrix.profiles ?? {})) !== JSON.stringify(requiredProfiles)) fail("assets/brand-asset-matrix.json: profiles must match the canonical 7-profile matrix and order.");
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
  const expectedPaths = (matrix.identities ?? []).flatMap((identity) => Object.keys(matrix.profiles ?? {}).map((profile) => `${identity}/${profile}`)).sort();
  for (const path of expectedPaths.filter((path) => !inventoryPaths.includes(path))) fail(`assets/asset-inventory.json: required matrix asset ${path} is missing.`);
  for (const path of inventoryPaths.filter((path) => !expectedPaths.includes(path))) fail(`assets/asset-inventory.json: ${path} is outside the canonical matrix.`);
  if (new Set(matrix.identities ?? []).size !== (matrix.identities ?? []).length) fail("assets/brand-asset-matrix.json: identity IDs must be unique.");
  if (expectedPaths.length !== 70) fail(`assets/brand-asset-matrix.json: expected exactly 70 assets, found ${expectedPaths.length}.`);
  for (const profile of Object.keys(matrix.profiles ?? {})) if (!Array.isArray(goldens.pixels?.[profile]) || goldens.pixels[profile].length !== matrix.identities.length) fail(`assets/visual-goldens.json: ${profile} must contain one golden for each canonical identity.`);
  for (const profile of Object.keys(goldens.pixels ?? {})) if (!(profile in (matrix.profiles ?? {}))) fail(`assets/visual-goldens.json: ${profile} is outside the canonical matrix.`);
  for (const asset of assets) {
    const [identity] = asset.logicalPath.split("/");
    const identityIndex = matrix.identities.indexOf(identity);
    await inspectAsset(asset, matrix.profiles ?? {}, goldens.pixels?.[asset.profile]?.[identityIndex]);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`brand asset verification failed: ${failure}`);
  process.exitCode = 1;
} else if (!process.argv.includes("--quiet")) {
  console.log(`brand asset verification passed: ${Object.keys(inventory.assets).length} immutable assets and ${Object.values(goldens.pixels).flat().length} visual goldens.`);
}
