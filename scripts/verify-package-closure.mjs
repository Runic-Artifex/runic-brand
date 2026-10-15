import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readSinglePackResult } from "./npm-pack-result.mjs";
import { matrixPaths } from "./asset-matrix.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifests = ["assets/asset-inventory.json", "assets/brand-asset-matrix.json", "assets/visual-goldens.json"];
const [inventory, matrix] = await Promise.all([
  readFile(resolve(root, "assets/asset-inventory.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "assets/brand-asset-matrix.json"), "utf8").then(JSON.parse),
]);
const generated = matrixPaths(matrix);
const inventoryPaths = Object.keys(inventory.assets).sort();
const expectedAssets = new Set([...manifests, ...generated.map((path) => `assets/generated/${path}`)]);
const pack = readSinglePackResult(JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] })));
const packedFiles = pack.files.map(({ path }) => path);
const packedAssets = new Set(packedFiles.filter((path) => path.startsWith("assets/")));
const missing = [...expectedAssets].filter((path) => !packedAssets.has(path));
const extra = [...packedAssets].filter((path) => !expectedAssets.has(path));
const missingLibrary = ["dist/index.js", "dist/index.d.ts", "dist/cli.js"].filter((path) => !packedFiles.includes(path));
const inventoryMismatch = JSON.stringify(inventoryPaths) !== JSON.stringify(generated);

if (missing.length || extra.length || missingLibrary.length || inventoryMismatch) {
  for (const path of missing) console.error(`brand package closure failed: missing ${path}`);
  for (const path of extra) console.error(`brand package closure failed: extra ${path}`);
  for (const path of missingLibrary) console.error(`brand package closure failed: missing ${path} (run npm run generate)`);
  if (inventoryMismatch) console.error("brand package closure failed: the asset inventory does not match the asset matrix.");
  process.exitCode = 1;
} else {
  console.log(`brand package closure passed: exactly ${generated.length} assets and ${manifests.length} manifests.`);
}
