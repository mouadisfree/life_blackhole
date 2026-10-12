/**
 * GLSL for the black hole. Kept as strings (no loader config needed).
 * Colours come in as uniforms from the design tokens. All materials use
 * additive blending, so fragment colour = emitted light and alpha is 1.
 */

const noise = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }
  mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }
`;

/** Shared colour ramp: white-hot near the horizon → gold → ember at the edge. */
const ramp = /* glsl */ `
  uniform vec3 uHot;
  uniform vec3 uMid;
  uniform vec3 uCool;
  vec3 tempColor(float t) {
    vec3 c = mix(uHot, uMid, smoothstep(0.0, 0.08, t));
    return mix(c, uCool, smoothstep(0.18, 0.75, t));
  }
`;

export const diskVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Flat accretion disk. Matter orbits with Keplerian speed (ω ∝ r^-1.5) so the
 * inner disk visibly outruns the outer disk; one side is brighter (Doppler beaming).
 */
export const diskFragment = /* glsl */ `
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  uniform float uMatter;
  varying vec2 vPos;
  ${noise}
  ${ramp}
  void main() {
    float r = length(vPos);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
    float omega = 1.4 / pow(max(r, 0.3), 1.5);
    vec2 p = rot(uTime * omega) * vPos;
    float n = fbm(p * 1.7);
    float fine = fbm(p * 5.0 + n * 2.0);
    float streak = 0.5 + 0.5 * sin(r * 11.0 + n * 9.0 + fine * 4.0);
    float rim = 1.0 + 1.6 * exp(-t * 14.0); // bright inner edge
    float intensity = pow(1.0 - t, 1.7) * (0.35 + 0.9 * n * fine * 1.6) * mix(0.85, 1.15, streak) * rim;
    float doppler = 1.0 + 0.55 * (vPos.x / max(r, 0.001));
    float edge = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.7, 1.0, t));
    vec3 col = tempColor(t) * intensity * doppler * uMatter * 0.95;
    // Additive blending: brightness lives in the colour; alpha stays 1.
    gl_FragColor = vec4(col * edge, 1.0);
  }
`;

export const haloVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Camera-facing quad behind the horizon: the photon ring plus the lensed image
 * of the far side of the disk, bent up over the top and under the bottom.
 */
export const haloFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHorizon;
  uniform float uMatter;
  varying vec2 vPos;
  ${noise}
  ${ramp}
  void main() {
    float r = length(vPos);
    vec2 dir = vPos / max(r, 0.001);
    float x = r / uHorizon;

    // Photon ring: razor thin, very bright.
    float photon = exp(-pow((x - 1.05) / 0.016, 2.0)) * 1.3;

    // Lensed disk band, thicker above than below.
    float thickness = mix(0.08, 0.22, smoothstep(-1.0, 1.0, dir.y));
    float band = smoothstep(1.07, 1.1, x) * (1.0 - smoothstep(1.1 + thickness * 0.5, 1.1 + thickness, x));
    float vertical = smoothstep(0.15, 0.9, abs(dir.y));
    vec2 p = rot(uTime * 0.35) * vPos;
    float n = fbm(p * 3.0 + 3.0);
    float lensed = band * vertical * (0.35 + 0.8 * n) * uMatter;

    // Soft outer glow.
    float glow = exp(-max(x - 1.0, 0.0) * 2.4) * 0.12 * uMatter;

    float t = clamp((x - 1.0) / 0.9, 0.0, 1.0);
    vec3 col = uHot * photon + tempColor(t + 0.15) * lensed * 1.1 + uCool * glow;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const particlesVertex = /* glsl */ `
  attribute vec4 aSeed; // x: phase, y: angle, z: speed, w: vertical jitter
  attribute float aIndex; // 0..1, compared against uShare
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  uniform float uHorizon;
  uniform float uShare;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vHeat;
  void main() {
    float life = fract(aSeed.x + uTime * aSeed.z * 0.04);
    float r = mix(uOuter * 1.05, uHorizon * 0.95, pow(life, 0.8));
    float ang = aSeed.y + uTime * 1.1 / pow(r, 1.5) + life * 9.0;
    vec3 pos = vec3(cos(ang) * r, (aSeed.w - 0.5) * 0.06 * r, sin(ang) * r);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (0.8 + aSeed.z * 1.2) * uPixelRatio * (8.0 / -mv.z);
    float visible = step(aIndex, uShare);
    vAlpha = visible * smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.88, 1.0, life));
    vHeat = 1.0 - clamp((r - uHorizon) / (uOuter - uHorizon), 0.0, 1.0);
  }
`;

export const particlesFragment = /* glsl */ `
  uniform vec3 uHot;
  uniform vec3 uCool;
  varying float vAlpha;
  varying float vHeat;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(mix(uCool, uHot, vHeat) * a, 1.0);
  }
`;
