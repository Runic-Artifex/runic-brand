import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const brandRoot = fileURLToPath(new URL("..", import.meta.url));
const workspaceRoot = dirname(brandRoot);
const check = process.argv.includes("--check");
const formats = ["banner.png", "icon.png", "social.png"];
const deployments = [
  [".github", "runic-artifex"],
  ["cs-webui", "cs-webui"],
  ["runic-assets", "runic-assets"],
  ["runic-command-line", "runic-command-line"],
  ["runic-desktop", "runic-desktop"],
  ["runic-docs", "runic-docs"],
  ["runic-flow", "runic-flow"],
  ["runic-site", "runic-artifex"],
  ["runic-toolkit", "runic-toolkit"],
  ["runic-toolkit-examples", "runic-toolkit"],
  ["runic-translations", "runic-translations"],
  ["runic-translations-editor", "runic-translations-editor"],
  ["runic-svelte", "runic-artifex"],
  ["runic-vite", "runic-artifex"],
];
const webAssets = [
  ["runic-site", "runic-artifex", "banner.png", "static/banner.png"],
  ["runic-site", "runic-artifex", "icon.png", "static/icon.png"],
  ["runic-site", "runic-artifex", "social.png", "static/og.png"],
  ["runic-site", "runic-toolkit", "icon.png", "static/products/runic-toolkit.png"],
  ["runic-site", "cs-webui", "icon.png", "static/products/cs-webui.png"],
  ["runic-site", "runic-flow", "icon.png", "static/products/runic-flow.png"],
  ["runic-site", "runic-assets", "icon.png", "static/products/runic-assets.png"],
  ["runic-site", "runic-translations", "icon.png", "static/products/runic-translations.png"],
  [
    "runic-site",
    "runic-translations-editor",
    "icon.png",
    "static/products/runic-translations-editor.png",
  ],
  ["runic-site", "runic-command-line", "icon.png", "static/products/runic-command-line.png"],
  ["runic-site", "runic-desktop", "icon.png", "static/products/runic-desktop.png"],
  ["runic-docs", "runic-docs", "icon.png", "public/icon.png"],
  ["runic-docs", "runic-docs", "social.png", "public/og.png"],
];

const mismatches = [];

for (const [repository, identity] of deployments) {
  const targetDirectory = join(workspaceRoot, repository, ".github", "assets", "brand");
  if (!check) await mkdir(targetDirectory, { recursive: true });

  for (const format of formats) {
    const source = join(brandRoot, "assets", "generated", identity, format);
    const target = join(targetDirectory, format);
    if (check) {
      try {
        const [expected, deployed] = await Promise.all([readFile(source), readFile(target)]);
        if (!expected.equals(deployed)) mismatches.push(`${repository}/${format}`);
      } catch {
        mismatches.push(`${repository}/${format}`);
      }
    } else {
      await copyFile(source, target);
    }
  }
}

for (const [repository, identity, format, targetPath] of webAssets) {
  const source = join(brandRoot, "assets", "generated", identity, format);
  const target = join(workspaceRoot, repository, targetPath);
  if (!check) await mkdir(dirname(target), { recursive: true });

  if (check) {
    try {
      const [expected, deployed] = await Promise.all([readFile(source), readFile(target)]);
      if (!expected.equals(deployed)) mismatches.push(`${repository}/${targetPath}`);
    } catch {
      mismatches.push(`${repository}/${targetPath}`);
    }
  } else {
    await copyFile(source, target);
  }
}

if (check && mismatches.length > 0) {
  console.error(`Brand assets are missing or stale:\n${mismatches.map((path) => `- ${path}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(check ? "Workspace brand assets are synchronized." : "Workspace brand assets updated.");
}
