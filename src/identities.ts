import type { BrandIdentity } from "./model.js";

const github = "https://github.com/Runic-Artifex";

/**
 * The identities that appear on a public surface today. The SDK packages follow
 * the products in docs.runic-artifex.eu: Application owns Views, Navigation,
 * templates and tools; Desktop owns the native hosts and platform services;
 * Assets owns asset packaging. Runic Flow is retired and has no identity; only
 * its glyph remains, for its archive page.
 */
export const identities = [
  {
    id: "runic-artifex",
    name: "Runic Artifex",
    shortName: "Runic",
    tagline: "Desktop applications with C# logic and the web frontend you know.",
    kind: "family",
    glyph: "runic",
    repository: github,
    packages: [],
  },
  {
    id: "runic-docs",
    name: "Runic Documentation",
    shortName: "Documentation",
    tagline: "Guides, API reference and release notes for every Runic product.",
    kind: "documentation",
    glyph: "runic",
    repository: `${github}/runic-site`,
    packages: [],
  },
  {
    id: "runic-application",
    name: "Runic Application",
    shortName: "Application",
    tagline: "Typed Windows, Views and navigation between .NET ViewModels and your frontend.",
    kind: "product",
    glyph: "application",
    repository: `${github}/runic-sdk`,
    packages: [
      "Runic.Application.Views*",
      "Runic.Application.Testing",
      "Runic.Application.Templates",
      "Runic.Navigation*",
      "Runic.Create",
      "dotnet-runic",
    ],
  },
  {
    id: "runic-desktop",
    name: "Runic Desktop",
    shortName: "Desktop",
    tagline: "Native windows and desktop services for web frontends on Windows, macOS and Linux.",
    kind: "product",
    glyph: "desktop",
    repository: `${github}/runic-sdk`,
    packages: ["Runic.Desktop*", "Runic.Platform*"],
  },
  {
    id: "runic-assets",
    name: "Runic Assets",
    shortName: "Assets",
    tagline: "One validated manifest for static assets, served by any host.",
    kind: "product",
    glyph: "assets",
    repository: `${github}/runic-sdk`,
    packages: ["Runic.Assets*"],
  },
  {
    id: "runic-translations",
    name: "Runic Translations",
    shortName: "Translations",
    tagline: "MessageFormat 2 messages as typed C# and TypeScript APIs.",
    kind: "product",
    glyph: "translations",
    repository: `${github}/runic-translations-sdk`,
    packages: ["Runic.Translations*", "dotnet-runic-translations"],
  },
  {
    id: "runic-translations-editor",
    name: "Runic Translations Editor",
    shortName: "Translations Editor",
    tagline: "Translate and review a MessageFormat 2 project, with the compiler's feedback in one place.",
    kind: "application",
    glyph: "translations",
    repository: `${github}/runic-translations-sdk/tree/main/apps/translations-editor`,
    packages: [],
  },
  {
    id: "runic-command-line",
    name: "Runic Command Line",
    shortName: "Command Line",
    tagline: "NativeAOT command-line applications from typed C# methods.",
    kind: "product",
    glyph: "command-line",
    repository: `${github}/runic-cli-sdk`,
    packages: ["Runic.CommandLine*"],
  },
  {
    id: "cs-webui",
    name: "CS-WebUI",
    shortName: "WebUI",
    tagline: "Use a web browser or WebView as the GUI of a .NET application.",
    kind: "related",
    glyph: "webui",
    repository: `${github}/cs-webui`,
    packages: ["CsWebUi*"],
  },
] as const satisfies readonly BrandIdentity[];

export function getIdentity(id: string): BrandIdentity {
  const identity = identities.find((candidate) => candidate.id === id);
  if (!identity) {
    throw new Error(`Unknown Runic identity '${id}'.`);
  }
  return identity;
}

/** The identity whose icon a NuGet package should carry, if any. */
export function identityForPackage(packageId: string): BrandIdentity | undefined {
  return identities.find((identity) =>
    identity.packages.some((pattern) =>
      pattern.endsWith("*") ? packageId.startsWith(pattern.slice(0, -1)) : packageId === pattern,
    ),
  );
}
