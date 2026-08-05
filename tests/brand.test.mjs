import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  dimensions,
  fragmentShader,
  identities,
  renderBrandAsset,
  vertexShader,
} from "../dist/index.js";

test("defines one stable identity for every Runic Artifex product", () => {
  assert.equal(identities.length, 9);
  assert.equal(new Set(identities.map((identity) => identity.id)).size, identities.length);
  assert.ok(identities.some((identity) => identity.id === "runic-artifex"));
  assert.ok(identities.some((identity) => identity.id === "runic-toolkit"));
  assert.ok(identities.some((identity) => identity.id === "runic-docs"));
});

test("renders deterministic vector-only typography", () => {
  const first = renderBrandAsset("runic-artifex", "social");
  const second = renderBrandAsset("runic-artifex", "social");
  assert.equal(first, second);
  assert.match(first, /width="1200" height="630"/);
  assert.match(first, /aria-label="Runic Artifex"/);
  assert.match(first, /<path d="M/);
  assert.doesNotMatch(first, /<path d=""/);
  assert.doesNotMatch(first, /<text\b/);
  assert.doesNotMatch(first, /font-family=/);
});

test("keeps the overlay transparent for the live shader", () => {
  const overlay = renderBrandAsset("runic-flow", "social", { transparent: true });
  assert.doesNotMatch(overlay, /<rect width="1200" height="630" fill="url\(#ground\)"/);
  assert.match(overlay, /Runic Flow/);
});

test("committed SVGs match the renderer", async () => {
  for (const identity of identities) {
    for (const format of ["social", "banner", "icon"]) {
      const committed = await readFile(
        new URL(`../assets/generated/${identity.id}/${format}.svg`, import.meta.url),
        "utf8",
      );
      assert.equal(committed, renderBrandAsset(identity.id, format), `${identity.id}/${format}`);
    }
  }
});

test("committed PNGs have the canonical dimensions", async () => {
  for (const identity of identities) {
    for (const format of ["social", "icon"]) {
      const metadata = await sharp(
        fileURLToPath(new URL(`../assets/generated/${identity.id}/${format}.png`, import.meta.url)),
      ).metadata();
      assert.equal(metadata.width, dimensions[format].width, `${identity.id}/${format} width`);
      assert.equal(metadata.height, dimensions[format].height, `${identity.id}/${format} height`);
    }
  }
});

test("ships WebGL 2 shader sources with the required uniforms", () => {
  assert.match(vertexShader, /^#version 300 es/);
  assert.match(fragmentShader, /^#version 300 es/);
  assert.match(fragmentShader, /uniform float u_seed;/);
  assert.match(fragmentShader, /uniform vec3 u_accent;/);
  assert.match(fragmentShader, /float fbm\(vec2 p\)/);
});
