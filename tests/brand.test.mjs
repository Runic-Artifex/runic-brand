import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { validateSvgDocument } from "../scripts/svg-security.mjs";
import {
  dimensions,
  faviconSvg,
  formats,
  glyph,
  glyphs,
  identities,
  identityForPackage,
  markData,
  palette,
  rasterizeBrandSvg,
  renderBrandAsset,
  tokensCss,
  webMarkFiles,
  wordmark,
} from "../dist/index.js";

const generated = new URL("../assets/generated/", import.meta.url);
const pathData = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\se+-]*$/u;
/** Compares committed output with a fresh render without dumping whole documents. */
function matchesRender(committed, rendered, label) {
  assert.ok(committed === rendered, `assets/generated/${label} differs from the renderer; run npm run generate.`);
}

const expectedIdentities = [
  "cs-webui",
  "runic-application",
  "runic-artifex",
  "runic-assets",
  "runic-command-line",
  "runic-desktop",
  "runic-docs",
  "runic-translations",
  "runic-translations-editor",
];

test("defines one stable identity for every Runic Artifex product", () => {
  const ids = identities.map((identity) => identity.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), expectedIdentities);
  // Retired products keep no identity.
  assert.ok(!ids.includes("runic-toolkit"));
  assert.ok(!ids.includes("runic-flow"));
  for (const identity of identities) {
    assert.ok(glyphs.includes(identity.glyph), `${identity.id} uses an unknown glyph`);
    assert.ok(identity.name && identity.tagline, `${identity.id} needs a name and tagline`);
  }
  assert.equal(identities.find((identity) => identity.id === "cs-webui")?.name, "CS-WebUI");
});

// The NuGet packages the three SDKs and CS-WebUI publish, by the identity their
// icon should carry. Update this list with each release that adds, renames or
// retires a package.
const publishedPackages = {
  "runic-application": [
    "Runic.Application.Views",
    "Runic.Application.Views.CsWebUi",
    "Runic.Application.Views.Desktop",
    "Runic.Application.Views.ReactiveUI",
    "Runic.Application.Views.ReactiveUI.Reactive",
    "Runic.Application.Views.Wpf",
    "Runic.Application.Testing",
    "Runic.Application.Templates",
    "Runic.Navigation",
    "Runic.Navigation.ReactiveUI",
    "Runic.Navigation.ReactiveUI.Reactive",
    "Runic.Navigation.Wpf",
    "Runic.Create",
    "dotnet-runic",
  ],
  "runic-desktop": [
    "Runic.Desktop",
    "Runic.Desktop.Gtk4",
    "Runic.Platform",
    "Runic.Platform.Runtime",
    "Runic.Platform.Windows",
    "Runic.Platform.Windows.Elevation",
    "Runic.Platform.Administration.Windows",
    "Runic.Platform.Linux",
    "Runic.Platform.Linux.Gtk4",
    "Runic.Platform.Linux.Polkit",
    "Runic.Platform.Linux.Portal",
    "Runic.Platform.MacOS",
  ],
  "runic-assets": ["Runic.Assets", "Runic.Assets.AspNetCore", "Runic.Assets.Desktop"],
  "runic-command-line": [
    "Runic.CommandLine",
    "Runic.CommandLine.Processes",
    "Runic.CommandLine.Spectre",
    "Runic.CommandLine.Testing",
  ],
  "runic-translations": [
    "Runic.Translations",
    "Runic.Translations.Build",
    "Runic.Translations.CommandLine",
    "Runic.Translations.Tooling",
    "Runic.Translations.Wpf",
    "Runic.Translations.Templates",
    "dotnet-runic-translations",
  ],
  "cs-webui": ["CsWebUi", "CsWebUi.Native"],
};

test("maps every published package to the identity of its product", () => {
  for (const [expected, packageIds] of Object.entries(publishedPackages)) {
    for (const packageId of packageIds) {
      assert.equal(identityForPackage(packageId)?.id, expected, packageId);
    }
  }
  // Package IDs renamed in 0.7.0-preview.7 get no further releases.
  for (const retired of ["Runic.Application", "Runic.Application.Desktop", "Runic.Application.Wpf"]) {
    assert.equal(identityForPackage(retired), undefined, retired);
  }
});

test("renders every identity and format deterministically as safe vector paths", () => {
  for (const identity of identities) {
    for (const format of formats) {
      const label = `${identity.id}/${format}`;
      const svg = renderBrandAsset(identity.id, format);
      assert.ok(svg === renderBrandAsset(identity.id, format), `${label} is not deterministic`);
      const { width, height } = dimensions[format];
      const root = new RegExp(`^<svg [^>]*width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`);
      assert.ok(root.test(svg), `${label} must declare ${width}x${height}`);
      assert.ok(/<path [^>]*d="M/.test(svg), `${label} has no path geometry`);
      assert.ok(!/<text\b/.test(svg), `${label} must convert text to paths`);
      assert.ok(!/font-family=/.test(svg), `${label} must not depend on runtime fonts`);
      assert.ok(!/\bstroke=/.test(svg), `${label} must use filled outlines`);
      assert.deepEqual(validateSvgDocument(svg, label), []);
    }
  }
});

test("declares the canonical format dimensions", () => {
  assert.deepEqual([...formats].sort(), ["banner", "icon", "presentation", "social"]);
  assert.deepEqual(dimensions, {
    social: { width: 1200, height: 630 },
    banner: { width: 1600, height: 480 },
    icon: { width: 512, height: 512 },
    presentation: { width: 1600, height: 900 },
  });
});

test("rasterizes every format at its own dimensions", async () => {
  for (const identity of identities) {
    for (const format of formats) {
      const { width, height } = dimensions[format];
      const png = await rasterizeBrandSvg(renderBrandAsset(identity.id, format), width, height);
      const metadata = await sharp(png).metadata();
      assert.equal(metadata.format, "png");
      assert.equal(metadata.width, width, `${identity.id}/${format} width`);
      assert.equal(metadata.height, height, `${identity.id}/${format} height`);
    }
  }
});

test("rasterizes deterministically and at integer scales only", async () => {
  const svg = renderBrandAsset("runic-artifex", "icon");
  const first = await rasterizeBrandSvg(svg, 512, 512);
  assert.deepEqual(first, await rasterizeBrandSvg(svg, 512, 512));
  const double = await sharp(await rasterizeBrandSvg(svg, 512, 512, 2)).metadata();
  assert.equal(double.width, 1024);
  assert.equal(double.height, 1024);
  await assert.rejects(rasterizeBrandSvg(svg, 512, 512, 5));
  await assert.rejects(rasterizeBrandSvg(svg, 512, 512, 1.5));
});

test("builds the wordmark and every glyph from filled path data", () => {
  const marks = [["wordmark", wordmark()], ...glyphs.map((name) => [name, glyph(name)])];
  for (const [name, mark] of marks) {
    assert.match(mark.ink, pathData, `${name} ink`);
    assert.match(mark.paint, pathData, `${name} paint`);
    assert.ok(mark.ink.trim() || mark.paint.trim(), `${name} has no path data`);
    assert.equal(mark.height, 100, `${name} height`);
  }
  assert.ok(wordmark().width > 100);
  for (const name of glyphs) {
    assert.equal(glyph(name).width, 100, `${name} width`);
    assert.deepEqual(glyph(name), glyph(name), `${name} is not deterministic`);
  }
});

test("exports web marks for every glyph and identity", () => {
  const data = markData();
  assert.deepEqual(data.wordmark, wordmark());
  assert.deepEqual(Object.keys(data.glyphs), [...glyphs]);
  const files = webMarkFiles();
  const expected = ["wordmark.svg", "wordmark-dark.svg", ...identities.flatMap(({ id }) => [`${id}.svg`, `${id}-dark.svg`])];
  assert.deepEqual(Object.keys(files).sort(), expected.sort());
  for (const [name, svg] of Object.entries({ ...files, "favicon.svg": faviconSvg("runic") })) {
    assert.deepEqual(validateSvgDocument(svg, name), []);
    assert.doesNotMatch(svg, /<text\b|\bstroke=/, name);
  }
});

test("defines the colour tokens for light and dark schemes", () => {
  const css = tokensCss();
  const darkStart = css.search(/prefers-color-scheme:\s*dark|data-scheme=['"]?dark/u);
  assert.ok(darkStart > 0, "tokens.css needs a dark scheme");
  assert.ok(css.slice(0, darkStart).includes(`--rune-paint: ${palette.light.paint};`), "light --rune-paint");
  assert.ok(css.slice(darkStart).includes(`--rune-paint: ${palette.dark.paint};`), "dark --rune-paint");
  assert.ok(css.includes("--rune-font-sans:"));
  assert.doesNotMatch(css, /@import|url\(/u);
});

test("committed vector sources and web exports match the renderer", async () => {
  for (const identity of identities) {
    for (const format of formats) {
      const committed = await readFile(new URL(`${identity.id}/${format}.svg`, generated), "utf8");
      matchesRender(committed, renderBrandAsset(identity.id, format), `${identity.id}/${format}.svg`);
    }
  }

  const web = new URL("web/", generated);
  matchesRender(await readFile(new URL("favicon.svg", web), "utf8"), faviconSvg("runic"), "web/favicon.svg");
  matchesRender(await readFile(new URL("marks.json", web), "utf8"), `${JSON.stringify(markData(), null, 2)}\n`, "web/marks.json");
  matchesRender(await readFile(new URL("tokens.css", web), "utf8"), tokensCss(), "web/tokens.css");
  const files = webMarkFiles();
  assert.deepEqual((await readdir(new URL("marks/", web))).sort(), Object.keys(files).sort(), "web/marks");
  for (const [name, svg] of Object.entries(files)) {
    matchesRender(await readFile(new URL(`marks/${name}`, web), "utf8"), svg, `web/marks/${name}`);
  }
  assert.deepEqual(
    (await readdir(generated)).sort(),
    [...identities.map(({ id }) => id), "web"].sort(),
    "assets/generated holds exactly one directory per identity and web",
  );
});

test("committed PNGs have the canonical dimensions", async () => {
  for (const identity of identities) {
    for (const format of formats) {
      const metadata = await sharp(fileURLToPath(new URL(`${identity.id}/${format}.png`, generated))).metadata();
      assert.equal(metadata.width, dimensions[format].width, `${identity.id}/${format} width`);
      assert.equal(metadata.height, dimensions[format].height, `${identity.id}/${format} height`);
    }
  }
});

test("rejects SVG payloads that Chrome could execute or fetch", async () => {
  const fixtures = [
    "namespaced-script.svg",
    "event-handler.svg",
    "escaped-javascript-url.svg",
    "external-href.svg",
    "dtd-entity.svg",
    "style-import.svg",
  ];
  for (const fixture of fixtures) {
    const payload = await readFile(new URL(`./fixtures/unsafe-svg/${fixture}`, import.meta.url), "utf8");
    assert.notEqual(validateSvgDocument(payload, fixture).length, 0, fixture);
  }
});
