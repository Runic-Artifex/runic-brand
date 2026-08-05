import { identities } from "../src/identities.js";
import { fragmentShader, vertexShader } from "../src/shader.js";

const select = element<HTMLSelectElement>("identity");
const motion = element<HTMLInputElement>("motion");
const overlay = element<HTMLImageElement>("overlay");
const canvas = element<HTMLCanvasElement>("material");
const downloadSvg = element<HTMLAnchorElement>("download-svg");
const downloadPng = element<HTMLAnchorElement>("download-png");

for (const identity of identities) {
  const option = document.createElement("option");
  option.value = identity.id;
  option.textContent = identity.name;
  select.append(option);
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
motion.checked = !reducedMotion;

const gl = requireWebGl(canvas);

const program = createProgram(gl, vertexShader, fragmentShader);
const positionLocation = gl.getAttribLocation(program, "a_position");
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const timeLocation = gl.getUniformLocation(program, "u_time");
const seedLocation = gl.getUniformLocation(program, "u_seed");
const accentLocation = gl.getUniformLocation(program, "u_accent");
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.useProgram(program);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

let seed = 0;
let accent: [number, number, number] = [0.65, 0.33, 0.2];

function updateIdentity(): void {
  const identity = identities.find((candidate) => candidate.id === select.value) ?? identities[0];
  const root = `/${identity.id}`;
  overlay.src = `${root}/social-overlay.svg`;
  overlay.alt = `${identity.name} social card rendered from vector paths`;
  downloadSvg.href = `${root}/social.svg`;
  downloadSvg.download = `${identity.id}-social.svg`;
  downloadPng.href = `${root}/social.png`;
  downloadPng.download = `${identity.id}-social.png`;
  seed = identity.id.split("").reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 997, 17);
  accent = hex(identity.accent);
}

function draw(timestamp: number): void {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(timeLocation, motion.checked ? timestamp / 1000 : 0);
  gl.uniform1f(seedLocation, seed);
  gl.uniform3f(accentLocation, ...accent);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  requestAnimationFrame(draw);
}

select.addEventListener("change", updateIdentity);
updateIdentity();
requestAnimationFrame(draw);

function createProgram(context: WebGL2RenderingContext, vertex: string, fragment: string): WebGLProgram {
  const program = context.createProgram();
  if (!program) throw new Error("Could not create WebGL program.");
  const vertexObject = compile(context, context.VERTEX_SHADER, vertex);
  const fragmentObject = compile(context, context.FRAGMENT_SHADER, fragment);
  context.attachShader(program, vertexObject);
  context.attachShader(program, fragmentObject);
  context.linkProgram(program);
  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    throw new Error(context.getProgramInfoLog(program) ?? "Could not link WebGL program.");
  }
  return program;
}

function compile(context: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = context.createShader(type);
  if (!shader) throw new Error("Could not create WebGL shader.");
  context.shaderSource(shader, source);
  context.compileShader(shader);
  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    throw new Error(context.getShaderInfoLog(shader) ?? "Could not compile WebGL shader.");
  }
  return shader;
}

function hex(value: string): [number, number, number] {
  const normalized = value.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255) as [number, number, number];
}

function element<T extends HTMLElement>(id: string): T {
  const value = document.getElementById(id);
  if (!value) throw new Error(`Missing #${id}.`);
  return value as T;
}

function requireWebGl(target: HTMLCanvasElement): WebGL2RenderingContext {
  const context = target.getContext("webgl2", { antialias: false, alpha: false });
  if (!context) throw new Error("WebGL 2 is required for the material preview.");
  return context;
}
