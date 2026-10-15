![Runic Artifex banner](assets/generated/runic-artifex/banner.png)

# Runic Brand

> **Design status:** canonical source. Approved assets are deployed to the Runic
> Artifex organization, product repositories, websites, and applications.

Runic Brand is the source of the Runic Artifex visual identity: the stave
grammar behind the RUNIC wordmark and the product glyphs, the colour and type
tokens, and a deterministic renderer that turns them into brand assets.

Everything is vector. Marks are filled outlines made of carved staves (ink) and
painted twigs (paint); text is converted to paths from Schibsted Grotesk, so no
asset depends on installed fonts. PNG files are rasterized from the same SVG
with a pinned version of `sharp`.

## Identities

| ID | Kind | Glyph | NuGet packages that carry its icon |
| --- | --- | --- | --- |
| `runic-artifex` | family | `runic` | |
| `runic-docs` | documentation | `runic` | |
| `runic-application` | product | `application` | `Runic.Application.Views*`, `Runic.Application.Testing`, `Runic.Application.Templates`, `Runic.Navigation*`, `Runic.Create`, `dotnet-runic` |
| `runic-desktop` | product | `desktop` | `Runic.Desktop*`, `Runic.Platform*` |
| `runic-assets` | product | `assets` | `Runic.Assets*` |
| `runic-translations` | product | `translations` | `Runic.Translations*`, `dotnet-runic-translations` |
| `runic-translations-editor` | application | `translations` | |
| `runic-command-line` | product | `command-line` | `Runic.CommandLine*` |
| `cs-webui` | related | `webui` | `CsWebUi*` |

`src/identities.ts` is authoritative; `node dist/cli.js list` prints it, and
`identityForPackage()` answers which icon a package ID should carry. The
products follow the documentation portal: Application owns Views, Navigation,
templates and tools; Desktop owns the native hosts and platform services;
Assets owns asset packaging. An application, something people run, gets its
icon on a stone tile; packages and projects get a basalt tile.

Retired names have no identity. Runic Toolkit is gone, and Runic Flow keeps only
its glyph for its archive page. The package IDs renamed in 0.7.0-preview.7
(`Runic.Application`, `Runic.Application.CsWebUi`, `Runic.Application.Desktop`,
`Runic.Application.Wpf`, `Runic.Application.ReactiveUI`,
`Runic.Application.ReactiveUI.Reactive`) get no further releases or icons.

## Generated formats

| Format | Dimensions | Intended use |
| --- | ---: | --- |
| `social` | 1200 × 630 | GitHub, social previews, release announcements |
| `banner` | 1600 × 480 | README and documentation headers |
| `icon` | 512 × 512 | Repository, package, application, and profile icons |
| `presentation` | 1600 × 900 | Text-safe 16:9 covers and closing slides |

Each identity is written to `assets/generated/<identity>/<format>.svg` and
`<format>.png`. Both files show the same artwork; use the PNG where a surface
does not accept SVG.

## Web exports

`assets/generated/web/` holds the assets websites and applications build on:

| File | Content |
| --- | --- |
| `favicon.svg` | The Runic glyph on a dark tile |
| `marks/<identity>.svg`, `marks/<identity>-dark.svg` | Each identity's glyph for light and dark backgrounds |
| `marks/wordmark.svg`, `marks/wordmark-dark.svg` | The RUNIC wordmark |
| `marks.json` | Wordmark and glyph outlines as `ink` and `paint` path data, for inline SVG |
| `tokens.css` | The palette as `--rune-*` custom properties for light and dark schemes, plus font stacks |

`tokens.css` follows `prefers-color-scheme` and can be forced with
`data-scheme="light"` or `data-scheme="dark"` on the root element. Websites
load their own fonts.

## Use the CLI

```bash
npm ci
npm run generate

node dist/cli.js list
node dist/cli.js render runic-translations --format banner --out translations-banner.svg
node dist/cli.js render runic-translations --format icon --png --scale 2 --out translations-icon@2x.png
node dist/cli.js render-all --out assets/generated
```

The package exposes the same functions programmatically:

```ts
import { markData, renderBrandAsset, tokensCss } from "@runic-artifex/brand";

const svg = renderBrandAsset("runic-translations", "banner");
```

## Change the brand

After changing anything in `src/`, regenerate the assets and their manifests
and commit both:

```bash
npm run update:manifests
```

This renders every identity and web export, then rewrites
`assets/brand-asset-matrix.json` (identities, profiles, and web files),
`assets/asset-inventory.json` (SHA-256 of every generated file), and
`assets/visual-goldens.json` (pixel digests under the pinned `sharp`).

## Deploy in the workspace

`scripts/sync-workspace-brand.mjs` copies generated files into sibling
repositories of this checkout, to the places those repositories read them:

| Repository | Target | Identity | Read by |
| --- | --- | --- | --- |
| `.github` | `.github/assets/brand/` | Runic Artifex | Organization profile README |
| `runic-site` | `.github/assets/brand/` | Runic Artifex | README banner |
| `cs-webui` | `.github/assets/brand/` | CS-WebUI | README banner, NuGet icon |
| `runic-sdk` | `eng/branding/application/` | Runic Application | NuGet icons through `eng/build/application.props` |
| `runic-sdk` | `eng/branding/desktop/` | Runic Desktop | Nix example application icon |
| `runic-sdk` | `eng/branding/assets/` | Runic Assets | NuGet icons through `eng/build/assets.props` |
| `runic-cli-sdk` | `eng/branding/command-line/` | Runic Command Line | NuGet icons through `eng/build/command-line.props` |
| `runic-translations-sdk` | `eng/branding/translations/` | Runic Translations | NuGet icons through `eng/build/translations.props` |
| `runic-translations-sdk` | `apps/translations-editor/.github/assets/brand/` | Runic Translations Editor | Editor README banner |
| `runic-translations-sdk` | `apps/translations-editor/Frontend/static/brand/icon.png` | Runic Translations Editor | Editor window and sidebar |
| `runic-site` | `static/og.png`, `static/icon.png`, `static/favicon.svg`, `static/brand/marks/`, `src/lib/brand/marks.json`, `src/lib/brand/tokens.css` | Runic Artifex | Website |
| `runic-site` | `docs/public/og.png`, `docs/public/icon.png`, `docs/public/favicon.svg`, `docs/public/brand/marks/`, `docs/src/lib/brand/` | Runic Documentation | Documentation portal |

Each `eng/branding/` and `.github/assets/brand/` target receives `banner.png`,
`icon.png` and `social.png`. The `brand/marks/` directories mirror `web/marks/`,
so marks that are no longer generated are removed. The workspace is the parent
of this checkout unless `--workspace=<directory>` or `RUNIC_WORKSPACE_ROOT` says
otherwise; a missing repository checkout is an error, so a run against the
wrong directory fails instead of silently doing nothing.

```bash
npm run sync:workspace
npm run check:workspace
node scripts/sync-workspace-brand.mjs --check --repository runic-sdk
```

`--check` compares without writing and exits non-zero on any difference.
`--repository` limits either mode to the named targets and can be repeated.
The script never changes README, project or package metadata; those surfaces
remain owned and reviewed by their consuming repository.

## Verification

```bash
npm audit --audit-level=high
npm run check
npm test
```

`npm test` rebuilds the library, regenerates every asset, and then verifies:

- the asset matrix matches the identities, formats, and web exports of the
  library, and the inventory is closed: every generated file is listed with its
  SHA-256 and nothing else is present;
- every PNG and SVG has its format's dimensions and matches its pixel golden;
- every SVG passes the security check: no scripts, event handlers, styles,
  external or data references, and bounded size and complexity;
- `marks.json` holds the wordmark and every glyph as path data, and
  `tokens.css` defines the palette without imports or URLs;
- the npm package contains exactly the generated assets and manifests; and
- the tests prove that rendering is deterministic, text is converted to paths,
  committed SVG and web files match a fresh render, and rasterized PNGs have the
  canonical dimensions.

CI also fails when the regenerated SVG or web files differ from the committed
ones.

See [docs/BRAND_GUIDELINES.md](docs/BRAND_GUIDELINES.md) before adding or
changing an identity.

## Publication status

This repository is public. `@runic-artifex/brand` remains a private workspace
package (`"private": true`) and is not published to npm. The package name in
source is not a claim of registry availability.

## License

The code, original vector geometry, and generated brand assets are licensed
under the MIT License. Font and runtime dependency notices are recorded in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
