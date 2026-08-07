#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { identities } from "./identities.js";
import { dimensions, renderBrandAsset } from "./render.js";
import { materializeBrandPng } from "./raster.js";
import { artDirections, formats, type ArtDirection, type BrandFormat } from "./model.js";

const [, , command, ...args] = process.argv;

switch (command) {
  case "list":
    for (const identity of identities) {
      console.log(`${identity.id.padEnd(25)} ${identity.name}`);
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
  const transparent = values.includes("--transparent");
  const direction = (readOption(values, "--direction") ?? "engraved") as ArtDirection;
  const scale = Number.parseInt(readOption(values, "--scale") ?? "1", 10);
  if (!identityId) usage("render requires an identity id.");
  if (!formats.includes(format as BrandFormat)) usage(`Unknown format '${format}'.`);
  if (!artDirections.includes(direction)) usage(`Unknown direction '${direction}'.`);

  const resolvedOutput = resolve(output ?? `${identityId}-${format}.${png ? "png" : "svg"}`);
  const svg = renderBrandAsset(identityId, format as BrandFormat, { transparent, direction });
  await mkdir(dirname(resolvedOutput), { recursive: true });
  if (png) {
    const size = dimensions[format as BrandFormat];
    const overlay = renderBrandAsset(identityId, format as BrandFormat, { transparent: true, direction });
    const buffer = await materializeBrandPng(overlay, size.width, size.height, identitySeed(identityId), { scale });
    await writeFile(resolvedOutput, buffer);
  } else {
    await writeFile(resolvedOutput, svg, "utf8");
  }
  console.log(resolvedOutput);
}

async function renderAll(values: string[]): Promise<void> {
  const outputRoot = resolve(readOption(values, "--out") ?? "assets/generated");
  for (const identity of identities) {
    const directory = join(outputRoot, identity.id);
    await mkdir(directory, { recursive: true });
    for (const format of formats) {
      const svg = renderBrandAsset(identity.id, format);
      const svgPath = join(directory, `${format}.svg`);
      await writeFile(svgPath, svg, "utf8");
      const size = dimensions[format];
      const overlay = renderBrandAsset(identity.id, format, { transparent: true });
      const png = await materializeBrandPng(overlay, size.width, size.height, identitySeed(identity.id));
      await writeFile(join(directory, `${format}.png`), png);
    }
    await writeFile(
      join(directory, "social-overlay.svg"),
      renderBrandAsset(identity.id, "social", { transparent: true }),
      "utf8",
    );
    console.log(identity.id);
  }
}

function readOption(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index < 0) return undefined;
  const value = values[index + 1];
  if (!value || value.startsWith("--")) usage(`${name} requires a value.`);
  return value;
}

function identitySeed(id: string): number {
  let value = 17;
  for (const character of id) value = (value * 31 + character.charCodeAt(0)) % 997;
  return value;
}

function usage(error?: string): never {
  if (error) console.error(error);
  console.error(`Usage:
  runic-brand list
  runic-brand render <identity> [--format social|banner|icon] [--direction engraved|architectural|ritual] [--out path] [--png] [--scale 1..4] [--transparent]
  runic-brand render-all [--out directory]`);
  process.exit(1);
}
