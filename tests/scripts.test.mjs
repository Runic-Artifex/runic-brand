import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { readSinglePackResult } from "../scripts/npm-pack-result.mjs";

const run = promisify(execFile);
const syncScript = fileURLToPath(new URL("../scripts/sync-workspace-brand.mjs", import.meta.url));
const generated = (path) => fileURLToPath(new URL(`../assets/generated/${path}`, import.meta.url));
const currentRepositories = [
  ".github",
  "cs-webui",
  "runic-cli-sdk",
  "runic-sdk",
  "runic-site",
  "runic-site/docs",
  "runic-translations-sdk",
];

test("reads npm pack --json output from npm 11 and npm 12", () => {
  const result = { name: "@runic-artifex/brand", files: [{ path: "assets/visual-goldens.json" }] };
  assert.equal(readSinglePackResult([result]), result);
  assert.equal(readSinglePackResult({ "@runic-artifex/brand": result }), result);
  assert.throws(() => readSinglePackResult([]), /0 package result/);
  assert.throws(() => readSinglePackResult({ a: result, b: result }), /2 package result/);
  assert.throws(() => readSinglePackResult(null), /0 package result/);
});

test("synchronizes and checks brand assets in the current workspace layout", async (context) => {
  const workspace = await mkdtemp(join(tmpdir(), "runic-brand-workspace-"));
  context.after(() => rm(workspace, { recursive: true, force: true }));
  const sync = (...args) => run(process.execPath, [syncScript, `--workspace=${workspace}`, ...args]);

  await assert.rejects(sync("--check"), (error) => /missing repository checkouts: \.github, runic-site, cs-webui/.test(error.stderr));

  await Promise.all(currentRepositories.map((repository) => mkdir(join(workspace, repository), { recursive: true })));
  await assert.rejects(sync("--check"), (error) =>
    /runic-sdk\/eng\/branding\/application\/icon\.png \(missing; source assets\/generated\/runic-application\/icon\.png\)/.test(error.stderr),
  );

  await sync();
  assert.match((await sync("--check")).stdout, /synchronized/);
  assert.deepEqual(
    await readFile(join(workspace, "runic-cli-sdk/eng/branding/command-line/banner.png")),
    await readFile(generated("runic-command-line/banner.png")),
  );
  assert.deepEqual(
    await readFile(join(workspace, "runic-site/docs/public/og.png")),
    await readFile(generated("runic-docs/social.png")),
  );
  assert.deepEqual(
    await readFile(join(workspace, "runic-translations-sdk/apps/translations-editor/Frontend/static/brand/icon.png")),
    await readFile(generated("runic-translations-editor/icon.png")),
  );
  // Retired targets are no longer written.
  await assert.rejects(access(join(workspace, "runic-sdk/eng/branding/svelte")));

  await writeFile(join(workspace, "runic-translations-sdk/eng/branding/translations/social.png"), "stale");
  await assert.rejects(sync("--check"), (error) =>
    /runic-translations-sdk\/eng\/branding\/translations\/social\.png \(stale; source assets\/generated\/runic-translations\/social\.png\)/.test(error.stderr),
  );

  // A mirrored marks directory drops marks that are no longer generated.
  await writeFile(join(workspace, "runic-site/static/brand/marks/runic-toolkit.svg"), "<svg/>");
  await assert.rejects(sync("--check", "--repository", "runic-site"), (error) => /runic-toolkit\.svg \(no longer generated\)/.test(error.stderr));
  await sync("--repository", "runic-site");
  await assert.rejects(access(join(workspace, "runic-site/static/brand/marks/runic-toolkit.svg")));
});
