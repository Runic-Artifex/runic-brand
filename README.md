# Runic Brand

> **Design status:** private workshop. The rendering foundation is functional,
> but no asset is approved for adoption by the other Runic Artifex repositories yet.

Runic Brand is the source and material-rendering system for the Runic Artifex
product family. Vector paths define typography, sigils, frames, and ornamental
construction. A deterministic raster stage turns those masks into the canonical
stone, engraved metal, patina, and relief artwork used on public surfaces.

The vector layer remains inspectable and portable, but it is construction source,
not the finished presentation asset. Canonical distributable artwork is PNG.

## Included identities

- Runic Artifex
- Runic Toolkit
- CsWebUi
- Runic Flow
- Runic Assets
- Runic Text Resources
- Runic Command Line
- Runic Artifex Documentation

Each identity has a distinct geometric sigil, accent, tagline, and repository
reference while sharing the same palette, typography, frame grammar, medallions,
and material model.

## Generated formats

| Format | Dimensions | Intended use |
| --- | ---: | --- |
| `social` | 1200 × 630 | GitHub, social previews, release announcements |
| `banner` | 1600 × 480 | README and documentation headers |
| `icon` | 512 × 512 | Repository, package, application, and profile icons |

Each format includes an SVG construction source and a materialized PNG. The
`social-overlay.svg` file contains only vector masks for the optional live WebGL
material study. Do not substitute the SVG source for the canonical PNG on a
public brand surface.

## Use the CLI

```bash
npm ci
npm run generate

node dist/cli.js list
node dist/cli.js render runic-flow --format social --out flow.source.svg
node dist/cli.js render runic-flow --format icon --png --scale 2 --out flow@2x.png
node dist/cli.js render-all --out assets/generated
```

The package exposes the same renderer programmatically:

```ts
import { renderBrandAsset } from "@runic-artifex/brand";

const svg = renderBrandAsset("runic-text-resources", "banner");
```

## Brand Studio

```bash
npm run dev
```

The studio shows the canonical material PNG by default. Its optional live mode
combines the transparent vector masks with a WebGL 2 stone shader for material
exploration; it is not silently substituted for the deterministic export.

## Verification

```bash
npm audit
npm run check
npm test
```

Tests prove that:

- every identity and format renders deterministically;
- typography contains vector paths rather than runtime font references;
- transparent overlays contain no material background;
- committed vector sources exactly match the renderer;
- PNG dimensions match the canonical format; and
- the CPU materializer and WebGL study retain deterministic contracts.

See [docs/BRAND_GUIDELINES.md](docs/BRAND_GUIDELINES.md) before adding or
changing an identity.

## Publication status

This repository is private during the initial Runic Artifex launch. The npm
package name is reserved in source but is not authorization to publish it.

## License

The code, original vector geometry, and generated brand assets are licensed
under the MIT License. Font and runtime dependency notices are recorded in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
