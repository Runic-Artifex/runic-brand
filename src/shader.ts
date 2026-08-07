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

float ridge(float value) {
  return 1.0 - abs(value * 2.0 - 1.0);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float drift = u_time * 0.004;
  float warp = fbm(p * 1.8 + vec2(drift, -drift * 0.6));
  float broad = fbm(p * 3.1 + vec2(warp * 1.7, -warp * 1.15));
  float mineral = ridge(fbm(p * 8.5 + vec2(broad * 2.4, warp)));
  float fiber = fbm(vec2(p.x * 22.0, p.y * 3.2) + broad * 1.4);
  float grain = hash(floor(v_uv * u_resolution * 0.72)) - 0.5;
  float vein = smoothstep(0.93, 0.985, mineral);
  float vignette = smoothstep(0.84, 0.22, length(p));

  vec3 ink = vec3(0.018, 0.032, 0.023);
  vec3 stone = vec3(0.050, 0.086, 0.060);
  vec3 color = mix(ink, stone, 0.16 + broad * 0.27);
  color += u_accent * max(0.0, broad - 0.72) * 0.026;
  color += (fiber - 0.5) * 0.018;
  color += grain * 0.011;
  color -= vein * vec3(0.022, 0.031, 0.024);
  color *= mix(0.38, 1.0, vignette);

  outColor = vec4(color, 1.0);
}`;
