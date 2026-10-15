#!/usr/bin/env node

import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { identities } from "./identities.js";
import { formats, type BrandFormat } from "./model.js";
import { rasterizeBrandSvg } from "./raster.js";
import { dimensions, renderBrandAsset } from "./render.js";
import { faviconSvg, markData, tokensCss, webMarkFiles } from "./web.js";

const [, , command, ...args] = process.argv;

switch (command) {
  case "list":
    for (const identity of identities) {
      console.log(`${identity.id.padEnd(27)} ${identity.name}`);
    }
    break;
  case "render":
    await renderOne(args);
    break;
  case "render-all":
    await renderAll(args);
    break;
  default:
    usage(command ? `Unknown command '${command}'.` : undefined);
}

async function renderOne(values: string[]): Promise<void> {
  const identityId = values[0];
  const format = readOption(values, "--format") ?? "social";
  const output = readOption(values, "--out");
  const png = values.includes("--png");
  const scale = Number.parseInt(readOption(values, "--scale") ?? "1", 10);
  if (!identityId) usage("render requires an identity id.");
  if (!formats.includes(format as BrandFormat)) usage(`Unknown format '${format}'.`);

  const resolvedOutput = resolve(output ?? `${identityId}-${format}.${png ? "png" : "svg"}`);
  const svg = renderBrandAsset(identityId, format as BrandFormat);
  await mkdir(dirname(resolvedOutput), { recursive: true });
  if (png) {
    const size = dimensions[format as BrandFormat];
    await writeFile(resolvedOutput, await rasterizeBrandSvg(svg, size.width, size.height, scale));
  } else {
    await writeFile(resolvedOutput, svg, "utf8");
  }
  console.log(resolvedOutput);
}

async function renderAll(values: string[]): Promise<void> {
  const requested = readOption(values, "--out");
  const outputRoot = resolve(requested ?? "assets/generated");
  // The default directory holds only generated files, so retired identities
  // must not survive a render. A directory passed with --out is left as it is.
  if (!requested) await rm(outputRoot, { recursive: true, force: true });
  for (const identity of identities) {
    const directory = join(outputRoot, identity.id);
    await mkdir(directory, { recursive: true });
    for (const format of formats) {
      const svg = renderBrandAsset(identity.id, format);
      await writeFile(join(directory, `${format}.svg`), svg, "utf8");
      const size = dimensions[format];
      await writeFile(join(directory, `${format}.png`), await rasterizeBrandSvg(svg, size.width, size.height));
    }
    console.log(identity.id);
  }

  const web = join(outputRoot, "web");
  await mkdir(join(web, "marks"), { recursive: true });
  for (const [name, svg] of Object.entries(webMarkFiles())) {
    await writeFile(join(web, "marks", name), svg, "utf8");
  }
  await writeFile(join(web, "favicon.svg"), faviconSvg("runic"), "utf8");
  await writeFile(join(web, "marks.json"), `${JSON.stringify(markData(), null, 2)}\n`, "utf8");
  await writeFile(join(web, "tokens.css"), tokensCss(), "utf8");
  console.log("web");
}

function readOption(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index < 0) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith("--")) usage(`${name} requires a value.`);
  return value;
}

function usage(error?: string): never {
  if (error) console.error(error);
  console.error(`Usage:
  runic-brand list
  runic-brand render <identity> [--format social|banner|icon|presentation] [--out path] [--png] [--scale 1..4]
  runic-brand render-all [--out directory]`);
  process.exit(1);
}
