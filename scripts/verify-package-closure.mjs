import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const [inventory, matrix] = await Promise.all([
  readFile(resolve(root, "assets/asset-inventory.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "assets/brand-asset-matrix.json"), "utf8").then(JSON.parse),
]);
const expectedAssets = new Set([
  "assets/asset-inventory.json",
  "assets/brand-asset-matrix.json",
  "assets/visual-goldens.json",
  ...matrix.identities.flatMap((identity) => Object.keys(matrix.profiles).map((profile) => `assets/generated/${identity}/${profile}`)),
]);
const pack = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }))[0];
const packedAssets = new Set(pack.files.map(({ path }) => path).filter((path) => path.startsWith("assets/")));
const missing = [...expectedAssets].filter((path) => !packedAssets.has(path));
const extra = [...packedAssets].filter((path) => !expectedAssets.has(path));
if (expectedAssets.size !== 73 || missing.length || extra.length) {
  for (const path of missing) console.error(`brand package closure failed: missing ${path}`);
  for (const path of extra) console.error(`brand package closure failed: extra ${path}`);
  process.exitCode = 1;
} else {
  console.log("brand package closure passed: exactly 70 assets and 3 manifests.");
}
