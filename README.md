# Runic Brand

Runic Brand is the vector-authoritative identity system for the Runic Artifex
product family. It generates deterministic SVG and PNG assets, converts all
typography to paths, and supplies an optional WebGL material shader for richer
documentation and presentation surfaces.

The shader never owns identity. Every product remains recognizable when only
the static vector layer is available.

## Included identities

- Runic Artifex
- Runic Toolkit
- CsWebUi
- Runic Markup
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

`social-overlay.svg` contains only the vector foreground. The Brand Studio
places it over the live shader without duplicating the layout.

## Use the CLI

```bash
npm ci
npm run generate

node dist/cli.js list
node dist/cli.js render runic-flow --format social --out flow.svg
node dist/cli.js render runic-markup --format icon --png --out markup.png
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

The studio combines the canonical transparent SVG with a WebGL 2 fragment
shader. It previews each product, supports reduced motion, and links directly
to the committed SVG and PNG exports.

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
- committed SVGs exactly match the renderer;
- PNG dimensions match the canonical format; and
- the shader sources retain their required WebGL 2 contracts.

See [docs/BRAND_GUIDELINES.md](docs/BRAND_GUIDELINES.md) before adding or
changing an identity.

## Publication status

This repository is private during the initial Runic Artifex launch. The npm
package name is reserved in source but is not authorization to publish it.

## License

The code, original vector geometry, and generated brand assets are licensed
under the MIT License. Font and runtime dependency notices are recorded in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
