# Runic Artifex brand guidelines

## Core principle

Runic Artifex is a family of independent products joined through explicit
seams. The visual system expresses that architecture through separate
medallions, visible connecting lines, and a shared geometric grammar.

## Authority layers

1. **Tokens** own color, spacing, line weight, and typography choices.
2. **Sigils** own project recognition and must remain readable in one color.
3. **Layouts** compose tokens and sigils into canonical formats.
4. **Materials** add grain, patina, illumination, and motion without changing
   the underlying identity.

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

Newsreader is the display face; Geist is the supporting sans face. The renderer
uses the OFL-licensed Fontsource distributions and converts every glyph to an
SVG path. Generated assets must not contain `<text>` elements or rely on local
font installation.

## Sigils

A sigil must:

- fit the common 100 × 100 construction grid;
- use rounded joins and caps;
- survive monochrome rendering;
- remain recognizable at 32 pixels;
- avoid letters as its primary shape; and
- describe the product capability rather than a particular framework adapter.

Official Toolkit integrations remain visually owned by the independent product.
For example, `RunicFlow.RunicToolkit` uses the Flow sigil and Flow accent.

## Material and motion

The procedural material uses seeded noise, broad moss variation, horizontal
fiber noise, sparse dust, and a vignette. Motion should be slow enough to read
as ambient material rather than animation.

All live surfaces must honor `prefers-reduced-motion`. Static exports use the
SVG material filter and are always available as the fallback.

## Clear space and alteration

- Keep at least one medallion-ring width around a standalone sigil.
- Do not stretch, skew, rotate, bevel, or add drop shadows to sigils.
- Do not recolor shared gold geometry with a project accent.
- Do not place title text inside a medallion.
- Do not edit generated assets directly; change the renderer or identity source.

## Adding an identity

1. Add the identity metadata to `src/identities.ts`.
2. Add a framework-neutral sigil to `src/geometry.ts`.
3. Run `npm run generate`.
4. Inspect social, banner, icon, and shader-overlay variants.
5. Run `npm test` and commit the regenerated assets with the source change.
