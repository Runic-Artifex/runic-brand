# Runic Artifex brand guidelines

## The idea: carved and painted

Runestones were carved, then painted. Red ochre filled the cut lines so the
inscription could be read from a distance, and the paint was renewed over the
years while the carving stayed.

Runic works the same way. The application is carved in C#: ViewModels,
Windows and Views, typed and lasting. The interface is painted with whatever
web frontend a team prefers, and it can be repainted without recutting the
stone. The brand keeps that split everywhere:

- **Stone** is the ground.
- **Ink** is the carving: text, structure, the staves of every mark.
- **Paint** marks only what carries meaning: the strokes that cross from one
  side to the other, links, focus and the current place.

If paint appears on something that does not carry meaning, remove it.

## Verbal identity

Use this definition when a page needs to introduce the organization:

> Runic Artifex makes open-source .NET tools for desktop applications,
> translations and command lines. Each product works on its own and connects
> to the others through documented integrations.

### Names

| Name | What it is |
| --- | --- |
| Runic Artifex | The organization and the whole product family. |
| Runic SDK | The `runic-sdk` repository and its release set: Runic Application, Runic Desktop, Runic Assets and their integrations. |
| Runic Translations | The `runic-translations-sdk` product, including Runic Translations Editor. Its own release cycle. |
| Runic Command Line | The `runic-cli-sdk` product. Its own release cycle. |
| CS-WebUI | A separate, related project: a .NET binding for WebUI. Not part of the SDK. |
| Runic Flow | Retired. Mention it only to point to Runic Application. |

"Runic" alone is fine in running text once the full name has appeared. Runic
Toolkit no longer exists as a product name.

### Voice

Write in a calm, exact, builder-to-builder voice. Lead with what a developer
can do, follow with how it works, then state the constraints. Use plain verbs,
sentence case and short sentences. Name things the way the reader will see
them in their editor: Window, View, ViewModel, client, command.

| Prefer | Avoid |
| --- | --- |
| product family, product, package | suite, platform, ecosystem |
| official integration, documented integration | seamless, magic |
| exact version, published on NuGet or npm | ready, released or available without registry evidence |
| what something waits for | promised dates |
| "Read the getting-started guide" | "Learn more", "Get started →" |

During preview, show exact versions and separate source availability from
registry publication. Never hide a dependency, a release-order constraint or
a platform gap to make a page sound simpler.

## The stave grammar

Every Runic mark is built from straight strokes only, the way runes were cut
across the grain of wood:

1. **Staves** are vertical strokes, carved in ink.
2. **Twigs** are diagonal strokes, filled with paint.
3. There are **no curves and no horizontal strokes**.
4. Strokes have one width within a mark, end flat against a shared band, and
   meet at mitred corners. Where a twig turns into a stave, the corner belongs
   to the twig, so the stave keeps a plain rectangular cut.

`src/geometry.ts` implements the grammar and emits filled outlines, so a mark
renders the same inline, as a file and as a raster.

### What the grammar must never produce

Runic marks are original glyphs, not historical runes. Some runic and
rune-like shapes have been taken up by hate movements. A Runic mark must not
resemble:

- a fork rising or falling from a stave (Algiz, the "life" and "death" runes);
- an asterisk-like crossing of a stave (Hagall);
- an arrow pointing up (Tiwaz);
- a lightning stroke or doubled lightning strokes (Sowilo);
- a diamond standing on two legs (Othala);
- a Z crossed by a bar (Wolfsangel), or any sun wheel.

Check a new glyph against this list at icon size and at full size, alone and
next to the wordmark, before adding it. When in doubt, draw something else.

## Wordmark and lockup

The wordmark is RUNIC in stave letters: an R with a pointed bowl, a U closed
by a V, an N, an I and a C with a short back. Only the diagonal of the N is
painted. It is the one stroke that crosses from one stave to the other, which
is what Runic does.

The lockup sets "Artifex" (or a descriptor such as "Documentation") in
Schibsted Grotesk on the wordmark's baseline. On websites the descriptor is
live text; in generated assets it is converted to paths.

- Use the wordmark at a cap height of at least 12 px.
- Keep clear space of half the cap height around the lockup.
- Do not set "RUNIC" in a font in place of the wordmark, and do not
  rearrange, recolour or paint other strokes.

## Glyphs

| Glyph | Identity | Construction and meaning |
| --- | --- | --- |
| `runic` | Runic Artifex, Runic Documentation | The R of the wordmark: one stave, a pointed bowl and a leg. |
| `application` | Runic Application | Two staves, .NET and the frontend, bound by two crossing twigs. |
| `desktop` | Runic Desktop | A window frame: staves for its sides, twigs for its top and bottom. |
| `assets` | Runic Assets | Fehu, the rune of property, as one stave with two rising twigs. |
| `translations` | Runic Translations and its Editor | One message passed between two languages: two offset chevrons. |
| `command-line` | Runic Command Line | A prompt and a cursor. |
| `webui` | CS-WebUI | Markup brackets around a binding. |
| `flow` | none | Three strokes moving forward. Kept only for Runic Flow's archive page. |

Glyphs live in a 100-unit box, with strokes 13 units wide, and must stay
recognizable at 16 px.

A package's icon is its product's glyph on a basalt tile. Every published
package carries the icon of the product that owns it, as the documentation
portal groups them: Application owns Views, Navigation, templates and tools;
Desktop owns the native hosts and platform services; Assets, Translations and
Command Line own their packages. An application, something people run, gets
its glyph on a stone tile instead, so Runic Translations Editor shares the
Translations glyph but is still told apart in a dock or taskbar.

Retired names get no identity and no icon. When a package is renamed, the new
ID takes the product's icon and the old ID is deprecated on NuGet without new
artwork.

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `stone` | `#ecede8` | `#15181a` | Page ground |
| `raised` | `#f7f7f4` | `#1c2023` | Panes, code, windows |
| `sunk` | `#e1e2dc` | `#101214` | Wells, inline code, control tracks |
| `ink` | `#1f2427` | `#e6e7e1` | Text, staves, primary buttons |
| `ink-soft` | `#4e565b` | `#a3a9a6` | Secondary text |
| `groove` | `#c8cac2` | `#30363a` | Rules and borders |
| `paint` | `#ae3b23` | `#e4704f` | Twigs, the crossing in code, link accents, focus, current place |
| `error` | `#9a2450` | `#e0708f` | State: something failed or is invalid |
| `warning` | `#86610f` | `#d9b25a` | State: something needs attention but still works |
| `done` | `#3c6a4c` | `#7fb58f` | State: something is complete |

Every text pairing meets WCAG AA. Paint on stone is 5.2:1 in light and 5.7:1
in dark. Groove is decorative; a control that needs a visible boundary uses
ink or a filled background.

### State colours

Error (crimson), warning (ochre) and done (moss) report the state of
something: a message that failed validation, a translation that needs review,
a step that is complete. They are not paint, and they are never decoration.

- Use a state colour only for an actual state, and remove it when the state
  goes away. Never use one for emphasis, a heading, a brand accent or a
  background wash.
- Never use paint for a state, and never a state colour for links, focus or
  the current place. Error is crimson, bluer than paint's red ochre, and stays
  at least 30 degrees of OKLCH hue away from it, so an error is not mistaken
  for the current place or a placeholder.
- Never let colour carry a state alone. Pair it with a shape (an icon, a
  marker, a border style) or with text that names the state, so it reads in
  greyscale, for colour-blind readers and for screen readers.

Each state colour meets 4.5:1 as text on `stone` and on `raised` in both
schemes; `tests/brand.test.mjs` enforces this and the hue distance from paint.
On `sunk`, use them for icons and borders rather than small text.

Documentation may use three functional pigments for notices, and only there:
woad `#2f5d8a` / `#8fb3da` for notes, verdigris `#2e6b55` / `#7cc2a3` for tips,
and yellow ochre `#7e5a10` / `#d9ae55` for warnings.

Paint is never a page background, a gradient or a heading colour. Primary
buttons are ink with stone text; on hover they take paint.

## Typography

- **Schibsted Grotesk** (variable) for all words: display, interface and
  reading text. It is sturdy enough for inscriptions and quiet enough for long
  guides.
- **Spline Sans Mono** (variable) for code, file names and commands.

Use the classical scale: 14, 15, 17 or 18, 21, 24, 30, 36, 48, 60 and 72 px.
Display headings are set at a weight of about 620 with tracking of about
-0.02em; body text at 400 with a line height of 1.55 to 1.65 and a measure
under 70 characters. Do not set labels in all capitals, and do not put a small
label above every heading.

## Layout: the seam

Wide compositions split along a vertical seam: words on stone on one side,
the subject on basalt or in code on the other. The generated social cards,
banners and presentation covers all use it, and so does the website's first
screen: the C# ViewModel on one side, the frontend on the other, and the
generated client as a stave whose twigs are the members that cross.

Use the seam when the content really has two sides. Otherwise, use
left-aligned columns separated by groove rules. Do not chop content into
identical rounded cards.

Radii follow hierarchy: 3 to 4 px for controls, 6 px for panes and code,
10 px for a window, 22 % for an app icon tile.

## Motion

Motion either tells one story once or answers what someone did.

- On load, a seam may be carved (the stave draws downward) and then painted
  (twigs fill in order), once.
- When someone acts, show what crossed the seam and in which direction.
- Respect `prefers-reduced-motion` by showing the end state immediately.

## Generated assets

| Format | Size | Composition |
| --- | --- | --- |
| `social` | 1200 × 630 | Seam: lockup, name and tagline on stone; glyph on basalt |
| `banner` | 1600 × 480 | The same seam, wider |
| `presentation` | 1600 × 900 | The same seam, for covers |
| `icon` | 512 × 512 | The glyph on a basalt tile (stone for applications), full bleed |

Do not edit generated files. Change the source in `src/`, then run
`npm run update:manifests`.

## Adding an identity

1. Add the identity to `src/identities.ts` with its kind, a plain one-line
   tagline and the NuGet package IDs that carry its icon. Prefer giving a new
   package to an existing product over a new identity.
2. Draw its glyph in `src/geometry.ts` with the stave grammar, or reuse the
   glyph of the product it belongs to.
3. Check the glyph against the list of shapes the grammar must never produce.
4. Run `npm run update:manifests`, inspect every format, and run `npm test`.
5. Add the identity to `scripts/sync-workspace-brand.mjs` where a repository
   reads it, and extend the published-package list in `tests/brand.test.mjs`.
