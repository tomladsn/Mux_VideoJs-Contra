/**
 * SPILL design tokens and OKLCH math helpers.
 * Pure TypeScript — no external dependencies.
 */

// ─── Fixed hex constants ───────────────────────────────────────────────────

export const BLACKWRAP = "#0E0C0D";
export const HAZE = "#191517";
export const DIFFUSION = "#F4ECDF";
export const TUNGSTEN = "#FFB04A";

// ─── Utility ───────────────────────────────────────────────────────────────

/** Clamp v to [min, max]. */
export function clampNum(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/** Shortest angular distance between two hues (degrees), result in [0, 180]. */
export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(((a - b + 540) % 360) - 180);
  return diff; // already in [0, 180] after the modular arithmetic
}

// ─── sRGB ↔ linear ────────────────────────────────────────────────────────

/** Convert a single sRGB channel (0–1) to linear light. */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Convert a single linear-light channel (0–1) to sRGB. */
export function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// ─── sRGB → OKLCH ─────────────────────────────────────────────────────────

/**
 * Convert sRGB channels (each 0–1) to OKLCH.
 * Pipeline: sRGB → linear → XYZ D65 → OKLab → OKLCH.
 */
export function rgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  // 1. sRGB → linear RGB
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // 2. Linear RGB → LMS (Oklab's LMS matrix)
  //    From the Oklab spec (Björn Ottosson): M1
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  // 3. Cube root
  const l3 = Math.cbrt(l_);
  const m3 = Math.cbrt(m_);
  const s3 = Math.cbrt(s_);

  // 4. LMS → OKLab (M2)
  const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
  const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
  const bLab = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;

  // 5. OKLab → OKLCH
  const C = Math.sqrt(a * a + bLab * bLab);
  let H = (Math.atan2(bLab, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L, c: C, h: H };
}

// ─── OKLCH → sRGB ─────────────────────────────────────────────────────────

/**
 * Convert OKLCH to sRGB channels (each 0–1, clamped).
 * Pipeline: OKLCH → OKLab → LMS → linear → sRGB.
 */
export function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  // 1. OKLCH → OKLab
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const bLab = c * Math.sin(hRad);

  // 2. OKLab → LMS (inverse M2)
  const l3 = l + 0.3963377774 * a + 0.2158037573 * bLab;
  const m3 = l - 0.1055613458 * a - 0.0638541728 * bLab;
  const s3 = l - 0.0894841775 * a - 1.2914855480 * bLab;

  // 3. Cube
  const lLms = l3 * l3 * l3;
  const mLms = m3 * m3 * m3;
  const sLms = s3 * s3 * s3;

  // 4. LMS → linear RGB (inverse M1)
  const lr = +4.0767416621 * lLms - 3.3077115913 * mLms + 0.2309699292 * sLms;
  const lg = -1.2684380046 * lLms + 2.6097574011 * mLms - 0.3413193965 * sLms;
  const lb = -0.0041960863 * lLms - 0.7034186147 * mLms + 1.7076147010 * sLms;

  // 5. Linear → sRGB, clamped
  return {
    r: clampNum(linearToSrgb(lr), 0, 1),
    g: clampNum(linearToSrgb(lg), 0, 1),
    b: clampNum(linearToSrgb(lb), 0, 1),
  };
}

// ─── CSS helpers ──────────────────────────────────────────────────────────

/**
 * Format an OKLCH triplet (and optional alpha) as a CSS `oklch()` string.
 * Values are rounded to 5 significant digits to keep CSS compact.
 */
export function oklchToCss(l: number, c: number, h: number, alpha?: number): string {
  const lStr = l.toFixed(4);
  const cStr = c.toFixed(4);
  const hStr = h.toFixed(2);
  if (alpha !== undefined && alpha !== 1) {
    return `oklch(${lStr} ${cStr} ${hStr} / ${alpha.toFixed(3)})`;
  }
  return `oklch(${lStr} ${cStr} ${hStr})`;
}
