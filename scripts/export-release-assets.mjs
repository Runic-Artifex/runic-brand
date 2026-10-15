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

function describe(logicalPath, asset) {
  if (asset.profile === "web") {
    return { logicalPath, sha256: asset.sha256, mediaType: matrix.web[logicalPath].mediaType };
  }
  const profile = matrix.profiles[asset.profile];
  return {
    logicalPath,
    sha256: asset.sha256,
    mediaType: profile.mediaType,
    dimensions: { width: profile.width, height: profile.height },
  };
}

console.log(JSON.stringify({
  schemaVersion: 2,
  package: {
    name: packageJson.name,
    version: packageJson.version,
    private: packageJson.private === true,
  },
  inventory: {
    logicalPath: "assets/asset-inventory.json",
    sha256: createHash("sha256").update(inventoryText).digest("hex"),
  },
  assets: Object.entries(inventory.assets).map(([logicalPath, asset]) => describe(logicalPath, asset)),
}, null, 2));
