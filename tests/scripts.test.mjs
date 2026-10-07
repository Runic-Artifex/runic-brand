import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { readSinglePackResult } from "../scripts/npm-pack-result.mjs";

const run = promisify(execFile);
const syncScript = fileURLToPath(new URL("../scripts/sync-workspace-brand.mjs", import.meta.url));
const generated = (identity, format) => fileURLToPath(new URL(`../assets/generated/${identity}/${format}`, import.meta.url));
const currentRepositories = [
  ".github",
  "cs-webui",
  "runic-cli-sdk",
  "runic-flow",
  "runic-sdk",
  "runic-site",
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

  await assert.rejects(sync("--check"), (error) => /missing repository checkouts: \.github, cs-webui, runic-flow/.test(error.stderr));

  await Promise.all(currentRepositories.map((repository) => mkdir(join(workspace, repository))));
  await assert.rejects(sync("--check"), (error) => /runic-sdk\/eng\/branding\/application\/icon\.png \(missing runic-toolkit\/icon\.png\)/.test(error.stderr));

  await sync();
  assert.match((await sync("--check")).stdout, /synchronized \(\d+ files\)/);
  assert.deepEqual(
    await readFile(join(workspace, "runic-cli-sdk/eng/branding/command-line/banner.png")),
    await readFile(generated("runic-command-line", "banner.png")),
  );
  assert.deepEqual(
    await readFile(join(workspace, "runic-site/docs/public/og.png")),
    await readFile(generated("runic-docs", "social.png")),
  );

  await writeFile(join(workspace, "runic-translations-sdk/eng/branding/translations/social.png"), "stale");
  await assert.rejects(sync("--check"), (error) => /runic-translations-sdk\/eng\/branding\/translations\/social\.png \(stale runic-translations\/social\.png\)/.test(error.stderr));
});
