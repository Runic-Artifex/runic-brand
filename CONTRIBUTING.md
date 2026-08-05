# Contributing

Changes to shared tokens or geometry affect every Runic Artifex product. Keep
pull requests focused and include regenerated assets when renderer output
changes.

Before opening a pull request:

```bash
npm ci
npm audit
npm run check
npm test
```

Do not edit files under `assets/generated` by hand. Do not add raster-only
identity elements. New third-party assets require a compatible license and an
entry in `THIRD_PARTY_NOTICES.md`.
