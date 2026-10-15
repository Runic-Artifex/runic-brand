import { copyFile, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Copies generated brand assets into sibling repositories of the workspace.
// Usage: node scripts/sync-workspace-brand.mjs [--check] [--workspace=<directory>] [--repository <path>]...

const brandRoot = fileURLToPath(new URL("..", import.meta.url));
const generatedRoot = join(brandRoot, "assets", "generated");

/**
 * `{banner,icon,social}.png` sets: [repository, target directory, identity].
 * README banners read `.github/assets/brand/`. NuGet package icons come from
 * `eng/branding/<product>/icon.png`, which each SDK's eng/build props pack.
 */
const brandSetFiles = ["banner.png", "icon.png", "social.png"];
const brandSets = [
  [".github", ".github/assets/brand", "runic-artifex"],
  ["runic-site", ".github/assets/brand", "runic-artifex"],
  ["cs-webui", ".github/assets/brand", "cs-webui"],
  ["runic-sdk", "eng/branding/application", "runic-application"],
  ["runic-sdk", "eng/branding/desktop", "runic-desktop"],
  ["runic-sdk", "eng/branding/assets", "runic-assets"],
  ["runic-cli-sdk", "eng/branding/command-line", "runic-command-line"],
  ["runic-translations-sdk", "eng/branding/translations", "runic-translations"],
  ["runic-translations-sdk", "apps/translations-editor/.github/assets/brand", "runic-translations-editor"],
];

/** Website assets: [source under assets/generated, target in the repository]. A trailing slash mirrors a directory. */
const sharedWebAssets = (publicDirectory) => [
  ["web/favicon.svg", `${publicDirectory}/favicon.svg`],
  ["web/marks/", `${publicDirectory}/brand/marks/`],
  ["web/marks.json", "src/lib/brand/marks.json"],
  ["web/tokens.css", "src/lib/brand/tokens.css"],
];
const webAssets = new Map([
  // The Editor's window and sidebar use its application icon.
  ["runic-translations-sdk", [["runic-translations-editor/icon.png", "apps/translations-editor/Frontend/static/brand/icon.png"]]],
  ["runic-site", [
    ["runic-artifex/social.png", "static/og.png"],
    ["runic-artifex/icon.png", "static/icon.png"],
    ...sharedWebAssets("static"),
  ]],
  ["runic-site/docs", [
    ["runic-docs/social.png", "public/og.png"],
    ["runic-docs/icon.png", "public/icon.png"],
    ...sharedWebAssets("public"),
  ]],
]);

const knownRepositories = [...new Set([...brandSets.map(([repository]) => repository), ...webAssets.keys()])];

function usage(message) {
  if (message) console.error(message);
  console.error(`Usage: node scripts/sync-workspace-brand.mjs [--check] [--workspace=<directory>] [--repository <path>]...

  --check              Compare deployed assets with the generated ones and exit
                       non-zero on any difference. Writes nothing.
  --workspace=<dir>    The directory that contains the repository checkouts.
                       Defaults to RUNIC_WORKSPACE_ROOT, then the parent of this
                       repository.
  --repository <path>  Limit to a target repository, relative to the workspace.
                       Repeatable. Known targets: ${knownRepositories.join(", ")}.`);
  process.exit(message ? 2 : 0);
}

function parseArguments(values) {
  let check = false;
  let workspace = process.env.RUNIC_WORKSPACE_ROOT ?? dirname(brandRoot);
  const repositories = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--check") check = true;
    else if (value.startsWith("--workspace=")) workspace = value.slice("--workspace=".length);
    else if (value === "--help" || value === "-h") usage();
    else if (value === "--repository" || value.startsWith("--repository=")) {
      const name = value.includes("=") ? value.slice(value.indexOf("=") + 1) : values[++index];
      if (!name || name.startsWith("--")) usage("--repository requires a path.");
      const normalized = name.replaceAll("\\", "/").replace(/^\.\//u, "").replace(/\/+$/u, "");
      if (!knownRepositories.includes(normalized)) usage(`Unknown target repository '${name}'.`);
      if (!repositories.includes(normalized)) repositories.push(normalized);
    } else usage(`Unknown argument '${value}'.`);
  }
  return {
    check,
    workspaceRoot: resolve(workspace),
    repositories: repositories.length ? repositories : knownRepositories,
  };
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function readOptional(path) {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

async function listFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

/** Expands the mappings for one repository into file copies and mirrored directories. */
async function planRepository(repository) {
  const copies = [];
  const mirrors = [];
  for (const [owner, directory, identity] of brandSets) {
    if (owner !== repository) continue;
    for (const file of brandSetFiles) {
      copies.push({ source: `${identity}/${file}`, target: `${directory}/${file}` });
    }
  }
  for (const [source, target] of webAssets.get(repository) ?? []) {
    if (!source.endsWith("/")) {
      copies.push({ source, target });
      continue;
    }
    const files = await listFiles(join(generatedRoot, source));
    if (!files.length) throw new Error(`assets/generated/${source} is empty; run npm run generate first.`);
    mirrors.push({ target, files });
    for (const file of files) copies.push({ source: `${source}${file}`, target: `${target}${file}` });
  }
  return { copies, mirrors };
}

const { check, workspaceRoot, repositories } = parseArguments(process.argv.slice(2));
const mismatches = [];
let written = 0;
let removed = 0;

// A missing checkout usually means the wrong workspace, so it fails rather
// than being skipped. Name the repositories that exist with --repository.
const missingRepositories = [];
for (const repository of repositories) {
  if (!(await isDirectory(join(workspaceRoot, repository)))) missingRepositories.push(repository);
}
if (missingRepositories.length > 0) {
  console.error(
    `Workspace ${workspaceRoot} is missing repository checkouts: ${missingRepositories.join(", ")}.\n` +
      "Pass --workspace=<directory>, set RUNIC_WORKSPACE_ROOT, or limit the run with --repository.",
  );
  process.exit(1);
}

for (const repository of repositories) {
  const repositoryRoot = join(workspaceRoot, repository);
  const { copies, mirrors } = await planRepository(repository);

  for (const { source, target } of copies) {
    const expected = await readOptional(join(generatedRoot, source));
    if (!expected) throw new Error(`assets/generated/${source} is missing; run npm run generate first.`);
    const targetPath = join(repositoryRoot, target);
    const deployed = await readOptional(targetPath);
    if (deployed && expected.equals(deployed)) continue;
    if (check) {
      mismatches.push(`${repository}/${target} (${deployed ? "stale" : "missing"}; source assets/generated/${source})`);
    } else {
      await mkdir(dirname(targetPath), { recursive: true });
      await copyFile(join(generatedRoot, source), targetPath);
      written += 1;
      console.log(`wrote ${repository}/${target}`);
    }
  }

  // A mirrored directory is owned by the brand: files that are no longer generated are stale.
  for (const { target, files } of mirrors) {
    for (const file of await listFiles(join(repositoryRoot, target))) {
      if (files.includes(file)) continue;
      if (check) {
        mismatches.push(`${repository}/${target}${file} (no longer generated)`);
      } else {
        await rm(join(repositoryRoot, target, file));
        removed += 1;
        console.log(`removed ${repository}/${target}${file}`);
      }
    }
  }
}

if (check && mismatches.length > 0) {
  console.error(`Brand assets are missing or stale:\n${mismatches.map((path) => `- ${path}`).join("\n")}`);
  process.exitCode = 1;
} else if (check) {
  console.log("Workspace brand assets are synchronized.");
} else {
  console.log(`Workspace brand assets updated: ${written} written, ${removed} removed.`);
}
