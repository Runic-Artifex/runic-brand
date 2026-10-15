# Third-party notices

Runic Brand is MIT-licensed. Its installed dependencies retain their own
licenses.

## Fonts

- **Schibsted Grotesk**, distributed through `@fontsource/schibsted-grotesk`,
  is licensed under the SIL Open Font License 1.1. The renderer reads the
  static Latin weights 400, 500 and 600.

The renderer converts glyph outlines into generated SVG paths, so the
generated assets contain no font files and consumers do not need the font at
runtime.

## Runtime libraries

- `fontkit` is MIT-licensed.
- `sharp` is Apache-2.0-licensed. Its prebuilt platform packages include
  libvips (`@img/sharp-libvips-*`, LGPL-3.0-or-later) and other separately
  licensed binary dependencies documented by that project.

Refer to each installed package for its complete license text and dependency
notices.
