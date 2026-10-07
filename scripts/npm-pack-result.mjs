/**
 * Returns the single package result from `npm pack --json` output.
 * npm 11 and earlier print an array of results; npm 12 prints an object keyed by package name.
 */
export function readSinglePackResult(output) {
  const results = Array.isArray(output) ? output : output && typeof output === "object" ? Object.values(output) : [];
  if (results.length !== 1 || !Array.isArray(results[0]?.files)) {
    throw new Error(`unexpected npm pack --json output with ${results.length} package result(s).`);
  }
  return results[0];
}
