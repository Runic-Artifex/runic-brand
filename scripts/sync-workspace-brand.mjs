import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const brandRoot = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const check = args.includes("--check");
const workspaceArgument = args.find((argument) => argument.startsWith("--workspace="));
const workspaceRoot = resolve(
  workspaceArgument?.slice("--workspace=".length) ?? process.env.RUNIC_WORKSPACE_ROOT ?? dirname(brandRoot),
);
const formats = ["banner.png", "icon.png", "social.png"];

// Each entry copies banner.png, icon.png and social.png of one identity into
// one directory of a current Runic-Artifex repository checkout.
const deployments = [
  [".github", "runic-artifex", ".github/assets/brand"],
  ["cs-webui", "cs-webui", ".github/assets/brand"],
  ["runic-flow", "runic-flow", ".github/assets/brand"],
  ["runic-site", "runic-artifex", ".github/assets/brand"],
  ["runic-site", "runic-docs", "docs/.github/assets/brand"],
  ["runic-sdk", "runic-toolkit", "eng/branding/application"],
  ["runic-sdk", "runic-assets", "eng/branding/assets"],
  ["runic-sdk", "runic-desktop", "eng/branding/desktop"],
  ["runic-sdk", "runic-artifex", "eng/branding/svelte"],
  ["runic-cli-sdk", "runic-command-line", "eng/branding/command-line"],
  ["runic-translations-sdk", "runic-translations", "eng/branding/translations"],
  ["runic-translations-sdk", "runic-translations-editor", "apps/translations-editor/.github/assets/brand"],
];
const productIcons = [
  ["runic-toolkit", "runic-application.png"],
  ["cs-webui", "cs-webui.png"],
  ["runic-flow", "runic-flow.png"],
  ["runic-assets", "runic-assets.png"],
  ["runic-translations", "runic-translations.png"],
  ["runic-translations-editor", "runic-translations-editor.png"],
  ["runic-command-line", "runic-command-line.png"],
  ["runic-desktop", "runic-desktop.png"],
];
const files = [
  ...deployments.flatMap(([repository, identity, directory]) =>
    formats.map((format) => [repository, identity, format, `${directory}/${format}`]),
  ),
  ["runic-site", "runic-artifex", "banner.png", "static/banner.png"],
  ["runic-site", "runic-artifex", "icon.png", "static/icon.png"],
  ["runic-site", "runic-artifex", "social.png", "static/og.png"],
  ["runic-site", "runic-docs", "icon.png", "docs/public/icon.png"],
  ["runic-site", "runic-docs", "social.png", "docs/public/og.png"],
  ...productIcons.flatMap(([identity, name]) => [
    ["runic-site", identity, "icon.png", `static/products/${name}`],
    ["runic-site", identity, "icon.png", `docs/public/products/${name}`],
  ]),
  [
    "runic-translations-sdk",
    "runic-translations-editor",
    "icon.png",
    "apps/translations-editor/Frontend/static/brand/icon.png",
  ],
];

const isDirectory = (path) => stat(path).then((entry) => entry.isDirectory(), () => false);
const missingRepositories = [];
for (const repository of new Set(files.map(([repository]) => repository))) {
  if (!(await isDirectory(join(workspaceRoot, repository)))) missingRepositories.push(repository);
}
if (missingRepositories.length > 0) {
  console.error(
    `Workspace ${workspaceRoot} is missing repository checkouts: ${missingRepositories.join(", ")}.\n` +
      "Pass --workspace=<directory> or set RUNIC_WORKSPACE_ROOT to the directory that contains them.",
  );
  process.exit(1);
}

const mismatches = [];

for (const [repository, identity, format, targetPath] of files) {
  const source = join(brandRoot, "assets", "generated", identity, format);
  const target = join(workspaceRoot, repository, targetPath);

  if (check) {
    try {
      const [expected, deployed] = await Promise.all([readFile(source), readFile(target)]);
      if (!expected.equals(deployed)) mismatches.push(`${repository}/${targetPath} (stale ${identity}/${format})`);
    } catch {
      mismatches.push(`${repository}/${targetPath} (missing ${identity}/${format})`);
    }
  } else {
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

if (check && mismatches.length > 0) {
  console.error(`Brand assets are missing or stale:\n${mismatches.map((path) => `- ${path}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(
    check
      ? `Workspace brand assets are synchronized (${files.length} files).`
      : `Workspace brand assets updated (${files.length} files).`,
  );
}
