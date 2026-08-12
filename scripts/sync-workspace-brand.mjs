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
const siteAssets = [
  ["runic-artifex", "banner.png", "static/banner.png"],
  ["runic-artifex", "icon.png", "static/icon.png"],
  ["runic-artifex", "social.png", "static/og.png"],
  ["runic-toolkit", "icon.png", "static/products/runic-toolkit.png"],
  ["cs-webui", "icon.png", "static/products/cs-webui.png"],
  ["runic-flow", "icon.png", "static/products/runic-flow.png"],
  ["runic-assets", "icon.png", "static/products/runic-assets.png"],
  ["runic-translations", "icon.png", "static/products/runic-translations.png"],
  [
    "runic-translations-editor",
    "icon.png",
    "static/products/runic-translations-editor.png",
  ],
  ["runic-command-line", "icon.png", "static/products/runic-command-line.png"],
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

for (const [identity, format, targetPath] of siteAssets) {
  const source = join(brandRoot, "assets", "generated", identity, format);
  const target = join(workspaceRoot, "runic-site", targetPath);
  if (!check) await mkdir(dirname(target), { recursive: true });

  if (check) {
    try {
      const [expected, deployed] = await Promise.all([readFile(source), readFile(target)]);
      if (!expected.equals(deployed)) mismatches.push(`runic-site/${targetPath}`);
    } catch {
      mismatches.push(`runic-site/${targetPath}`);
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
