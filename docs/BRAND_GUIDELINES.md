# Runic Artifex brand guidelines

## Core principle

Runic Artifex is a family of independent products joined through explicit
seams. The visual system expresses that architecture through separate
medallions, visible connecting lines, and a shared geometric grammar.

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
