# Runic Artifex brand guidelines

## Core principle

Runic Artifex is a family of independent products joined through explicit
seams. The visual system expresses that architecture through separate
medallions, visible connecting lines, and a shared geometric grammar.

## Verbal identity

Use this definition when a page needs to introduce the organization:

> Runic Artifex is a family of open-source .NET tools for desktop and browser
> UI, application hosting, workflows, assets, localization, and command-line
> apps. Each product works independently and connects through documented
> integrations when needed.

### Product hierarchy

Runic Artifex names the organization and the complete product family. Runic
Toolkit is one product within that family. It brings together application
hosting, desktop windows, frontend builds, and Application Bridge, but it is not
an umbrella name for the other products. CS-WebUI, Runic Flow, Runic Assets,
Runic Translations, Runic Translations Editor, and Runic Command Line retain
their own identities, repositories, and release cycles. Package-based products
own their package families; Runic Translations Editor owns its desktop
archives.

Explain the integration model in plain language before using architectural
shorthand:

> Each tool works on its own. Official integrations connect tools without
> forcing their cores to depend on each other, so products can keep separate
> packages and release cycles.

After that explanation, **explicit seams** is the preferred short form.
Integration-only repositories and packages use the Runic Artifex family
identity unless a product owns the integration; product-owned integrations keep
that product's name and identity.

### Voice and structure

Write in a calm, exact, builder-to-builder voice. Start with the outcome a
developer can achieve, follow with the mechanism that makes it possible, and
then state the important constraints. Prefer short, concrete sentences and
active verbs. Technical precision should make the writing easier to trust, not
harder to read.

| Prefer | Avoid |
| --- | --- |
| product family, independent product | suite, monolith, all-in-one framework |
| official integration, documented integration | magic integration, seamless ecosystem |
| explicit seam, after explaining it plainly | unexplained architectural shorthand |
| exact candidate, verified candidate | ready, released, or available without registry evidence |
| available on NuGet/npm | public when only the source repository is public |
| preview, current constraint, what it waits for | hype, absolutes, or promises about future dates |

During preview, show exact versions and distinguish source availability,
verified candidates, and registry publication. Say **Verified candidate · not
yet published** until the artifact can be fetched from its public registry. Say
**First preview pending** when no candidate exists, and name NuGet or npm when an
artifact is available there. Never hide a dependency, release-order constraint,
compatibility identifier, or publication gate to make a page sound simpler.

## Authority layers

1. **Tokens** own color, spacing, line weight, and typography choices.
2. **Sigils** own project recognition and must remain readable in one color.
3. **Layouts** compose tokens and sigils into canonical formats.
4. **Materials** turn the vector masks into canonical engraved artwork through
   stone variation, metallic light, edge relief, wear, and patina.

Never encode required text, geometry, or meaning exclusively in a shader.

## Color

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#0b100d` | Primary background |
| Moss | `#18231b` | Raised surfaces and medallions |
| Moss light | `#314536` | Local illumination |
| Parchment | `#eee4cb` | Primary text |
| Gold | `#c9a65b` | Shared structure and emphasis |
| Gold dim | `#75633a` | Secondary geometry |
| Rust | `#a65432` | Organization accent |

Product accents may vary, but gold remains the common connective material.

## Typography

Cormorant Medium is the display face; Geist is the supporting sans face. The renderer
uses the OFL-licensed Fontsource distributions and converts every glyph to an
SVG path. Generated assets must not contain `<text>` elements or rely on local
font installation.

## Sigils

A sigil must:

- fit the common 100 × 100 construction grid;
- use the shared square-cap, miter-join engraving grammar;
- survive monochrome rendering;
- remain recognizable at 32 pixels;
- avoid letters as its primary shape; and
- describe the product capability rather than a particular framework adapter.

Official Toolkit integrations remain visually owned by the independent product.
For example, `RunicFlow.RunicToolkit` uses the Flow sigil and Flow accent.

## Material and motion

The deterministic export material uses seeded multi-scale mineral noise, moss
variation, directional light, fine grain, metal weathering, a cut-shadow edge,
and raised highlights. Its PNG output is the canonical public artwork.

The WebGL shader is a live material study. It must honor `prefers-reduced-motion`
and may never become the only way to obtain an identity. The SVG is retained as
editable construction source, not as a cheaper public fallback.

## Clear space and alteration

- Keep at least one medallion-ring width around a standalone sigil.
- Do not stretch, skew, rotate, or add effects outside the approved materializer.
- Do not recolor shared gold geometry with a project accent.
- Do not place title text inside a medallion.
- Do not edit generated assets directly; change the renderer or identity source.

## Adding an identity

1. Add the identity metadata to `src/identities.ts`.
2. Add a framework-neutral sigil to `src/geometry.ts`.
3. Run `npm run generate`.
4. Inspect social, banner, icon, and shader-overlay variants.
5. Run `npm test` and commit the regenerated assets with the source change.
