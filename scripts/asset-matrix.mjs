// The canonical asset matrix, derived from the built library so the manifests
// cannot drift from the identities, formats and web exports in src/.

export const mediaTypes = new Map([
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".json", "application/json"],
  [".css", "text/css"],
]);

export function extensionOf(path) {
  const slash = path.lastIndexOf("/");
  const dot = path.lastIndexOf(".");
  return dot > slash ? path.slice(dot) : "";
}

/** Loads dist/index.js. Run `npm run generate` (or `npm run build:library`) first. */
export async function loadBrand() {
  try {
    return await import(new URL("../dist/index.js", import.meta.url).href);
  } catch (error) {
    throw new Error(`cannot load dist/index.js (${error.message}); run npm run generate first.`);
  }
}

/** The matrix written to assets/brand-asset-matrix.json. */
export function canonicalMatrix(brand) {
  const identities = brand.identities.map((identity) => identity.id).sort();
  const profileEntries = [];
  for (const format of brand.formats) {
    const { width, height } = brand.dimensions[format];
    for (const extension of [".png", ".svg"]) {
      profileEntries.push([`${format}${extension}`, { mediaType: mediaTypes.get(extension), width, height }]);
    }
  }
  const webPaths = [
    "web/favicon.svg",
    "web/marks.json",
    "web/tokens.css",
    ...Object.keys(brand.webMarkFiles()).map((name) => `web/marks/${name}`),
  ].sort();
  return {
    schemaVersion: 2,
    identities,
    profiles: Object.fromEntries(profileEntries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
    web: Object.fromEntries(webPaths.map((path) => [path, { mediaType: mediaTypes.get(extensionOf(path)) }])),
  };
}

/** Every logical path under assets/generated that the matrix requires, sorted. */
export function matrixPaths(matrix) {
  return [
    ...matrix.identities.flatMap((identity) => Object.keys(matrix.profiles).map((profile) => `${identity}/${profile}`)),
    ...Object.keys(matrix.web),
  ].sort();
}
