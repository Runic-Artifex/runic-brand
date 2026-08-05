import type { BrandIdentity } from "./model.js";

const github = "https://github.com/Runic-Artifex";

export const identities = [
  {
    id: "runic-artifex",
    name: "Runic Artifex",
    shortName: "Artifex",
    monogram: "RA",
    tagline: "Independent tools. Explicit seams.",
    accent: "#a65432",
    sigil: "artifex",
    repository: github,
  },
  {
    id: "runic-toolkit",
    name: "Runic Toolkit",
    shortName: "Toolkit",
    monogram: "RT",
    tagline: "One application model across .NET surfaces.",
    accent: "#c9a65b",
    sigil: "toolkit",
    repository: `${github}/runic-toolkit`,
  },
  {
    id: "cs-webui",
    name: "CsWebUi",
    shortName: "WebUI",
    monogram: "CW",
    tagline: "A lightweight native host for web-powered .NET UI.",
    accent: "#b77650",
    sigil: "webui",
    repository: `${github}/cs-webui`,
  },
  {
    id: "runic-markup",
    name: "Runic Markup",
    shortName: "Markup",
    monogram: "RM",
    tagline: "Compiled UI languages with explicit host integrations.",
    accent: "#b78955",
    sigil: "markup",
    repository: `${github}/runic-markup`,
  },
  {
    id: "runic-flow",
    name: "Runic Flow",
    shortName: "Flow",
    monogram: "RF",
    tagline: "Typed application mechanics without a UI dependency.",
    accent: "#78956f",
    sigil: "flow",
    repository: `${github}/runic-flow`,
  },
  {
    id: "runic-assets",
    name: "Runic Assets",
    shortName: "Assets",
    monogram: "RA",
    tagline: "Portable static assets across hosts and frameworks.",
    accent: "#a98755",
    sigil: "assets",
    repository: `${github}/runic-assets`,
  },
  {
    id: "runic-text-resources",
    name: "Runic Text Resources",
    shortName: "Text Resources",
    monogram: "TR",
    tagline: "Deterministic localization across languages.",
    accent: "#8e9360",
    sigil: "text-resources",
    repository: `${github}/runic-text-resources`,
  },
  {
    id: "runic-command-line",
    name: "Runic Command Line",
    shortName: "Command Line",
    monogram: "CL",
    tagline: "Reflection-free command applications for NativeAOT.",
    accent: "#9a7657",
    sigil: "command-line",
    repository: `${github}/runic-command-line`,
  },
  {
    id: "runic-docs",
    name: "Runic Artifex Documentation",
    shortName: "Documentation",
    monogram: "RD",
    tagline: "The map of independent tools and explicit seams.",
    accent: "#c09a52",
    sigil: "documentation",
    repository: `${github}/runic-docs`,
  },
] as const satisfies readonly BrandIdentity[];

export function getIdentity(id: string): BrandIdentity {
  const identity = identities.find((candidate) => candidate.id === id);
  if (!identity) {
    throw new Error(`Unknown identity '${id}'. Run 'runic-brand list' for valid identities.`);
  }
  return identity;
}
