import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const [packageJson, inventoryText, matrix] = await Promise.all([
  readFile(resolve(root, "package.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "assets/asset-inventory.json"), "utf8"),
  readFile(resolve(root, "assets/brand-asset-matrix.json"), "utf8").then(JSON.parse),
]);
const inventory = JSON.parse(inventoryText);

console.log(JSON.stringify({
  schemaVersion: 1,
  package: {
    name: packageJson.name,
    version: packageJson.version,
    private: packageJson.private === true,
  },
  inventory: {
    logicalPath: "assets/asset-inventory.json",
    sha256: createHash("sha256").update(inventoryText).digest("hex"),
  },
  assets: Object.entries(inventory.assets).map(([logicalPath, asset]) => ({
    logicalPath,
    sha256: asset.sha256,
    mediaType: matrix.profiles[asset.profile].mediaType,
    dimensions: {
      width: matrix.profiles[asset.profile].width,
      height: matrix.profiles[asset.profile].height,
    },
  })),
}, null, 2));
