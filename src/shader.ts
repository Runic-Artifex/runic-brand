export const vertexShader = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

export const fragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform vec3 u_accent;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32 + u_seed);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float drift = u_time * 0.012;
  float broad = fbm(p * 2.4 + vec2(drift, -drift * 0.7));
  float fiber = fbm(vec2(p.x * 32.0, p.y * 5.0) + broad * 2.0);
  float speck = step(0.965, hash(floor(v_uv * u_resolution * 0.34)));
  float vignette = smoothstep(0.84, 0.22, length(p));

  vec3 ink = vec3(0.035, 0.058, 0.043);
  vec3 moss = vec3(0.085, 0.135, 0.102);
  vec3 color = mix(ink, moss, 0.20 + broad * 0.22);
  color += u_accent * max(0.0, broad - 0.66) * 0.075;
  color += (fiber - 0.5) * 0.045;
  color += speck * vec3(0.13, 0.11, 0.065);
  color *= mix(0.45, 1.0, vignette);

  outColor = vec4(color, 1.0);
}`;
