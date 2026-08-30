import { SaxesParser } from "saxes";

const svgNamespace = "http://www.w3.org/2000/svg";
const activeElements = new Set([
  "script", "foreignobject", "iframe", "object", "embed", "image", "audio", "video", "canvas",
  "animate", "animatemotion", "animatetransform", "set", "discard", "handler",
]);
const referenceAttributes = new Set(["href", "src", "xlink:href"]);
const maxElements = 2_000;
const maxAttributes = 10_000;
const maxPathDataCharacters = 100_000;
const maxCssReferenceCharacters = 16_384;

function normalizeCss(value) {
  return value
    .replace(/\\([0-9a-f]{1,6})\s?/giu, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)))
    .replace(/\\(.)/gsu, "$1")
    .replace(/[\u0000-\u0020\u007f]+/gu, "")
    .toLowerCase();
}

function isLocalFragment(value) {
  return /^#[A-Za-z_][A-Za-z0-9_.:-]*$/u.test(value);
}

function validateReference(value, label, attribute, failures) {
  const normalized = normalizeCss(value);
  if (normalized.includes("@import")) failures.push(`${label}: ${attribute} contains a CSS import.`);
  if (/(?:javascript|data|https?|file):/u.test(normalized)) failures.push(`${label}: ${attribute} contains an external, data, or javascript URL.`);

  for (const match of normalized.matchAll(/url\(([^)]*)\)/gu)) {
    const target = match[1].replace(/^['"]|['"]$/gu, "");
    if (!isLocalFragment(target)) failures.push(`${label}: ${attribute} contains a non-local CSS URL.`);
  }
  if (normalized.includes("url(") && !/url\([^)]*\)/u.test(normalized)) failures.push(`${label}: ${attribute} contains an unterminated CSS URL.`);
}

export function validateSvgDocument(content, label) {
  const failures = [];
  let rootSeen = false;
  let depth = 0;
  let elementCount = 0;
  let attributeCount = 0;
  const parser = new SaxesParser({ xmlns: true });

  parser.on("error", (error) => failures.push(`${label}: malformed XML (${error.message}).`));
  parser.on("doctype", () => failures.push(`${label}: DTDs and entities are not allowed.`));
  parser.on("processinginstruction", () => failures.push(`${label}: processing instructions are not allowed.`));
  parser.on("opentag", (tag) => {
    depth += 1;
    elementCount += 1;
    if (elementCount > maxElements) failures.push(`${label}: exceeds the SVG element complexity limit.`);
    const localName = tag.local.toLowerCase();
    if (!rootSeen) {
      rootSeen = true;
      if (localName !== "svg" || tag.uri !== svgNamespace) failures.push(`${label}: root element must be an SVG in the SVG namespace.`);
    }
    if (tag.uri !== svgNamespace) failures.push(`${label}: ${tag.name} is not in the SVG namespace.`);
    if (activeElements.has(localName)) failures.push(`${label}: ${tag.name} is an unsafe SVG element.`);
    if (localName === "style") failures.push(`${label}: style elements are not allowed.`);

    for (const attribute of Object.values(tag.attributes)) {
      attributeCount += 1;
      if (attributeCount > maxAttributes) failures.push(`${label}: exceeds the SVG attribute complexity limit.`);
      const attributeName = attribute.name.toLowerCase();
      const attributeLocal = attribute.local.toLowerCase();
      if (attribute.prefix === "xmlns" || attributeName === "xmlns") continue;
      if (attributeLocal.startsWith("on")) failures.push(`${label}: ${attribute.name} is an inline event handler.`);
      if (attributeLocal === "style") failures.push(`${label}: style attributes are not allowed.`);
      if (attributeLocal === "d" && attribute.value.length > maxPathDataCharacters) failures.push(`${label}: path data exceeds the complexity limit.`);
      if (attribute.value.length > maxCssReferenceCharacters) failures.push(`${label}: attribute value exceeds the CSS/reference complexity limit.`);
      validateReference(attribute.value, label, attribute.name, failures);
      if (referenceAttributes.has(attributeName) && !isLocalFragment(attribute.value.trim())) failures.push(`${label}: ${attribute.name} must be a local fragment reference.`);
    }
  });
  parser.on("closetag", () => { depth -= 1; });

  try {
    parser.write(content).close();
  } catch (error) {
    failures.push(`${label}: malformed XML (${error.message}).`);
  }
  if (!rootSeen || depth !== 0) failures.push(`${label}: is not a complete SVG document.`);
  return [...new Set(failures)];
}
