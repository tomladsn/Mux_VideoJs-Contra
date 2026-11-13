/**
 * SPILL theme engine.
 * Derives a reactive colour palette from a video frame's ImageData.
 */

import {
  TUNGSTEN,
  DIFFUSION,
  rgbToOklch,
  oklchToRgb,
  oklchToCss,
  clampNum,
  hueDistance,
  srgbToLinear,
} from "./tokens";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SpillTheme {
  key: string;    // oklch CSS string
  fill: string;
  room: string;
  panel: string;
  rim: string;    // key at 35% alpha
  keyHue: number;
  fillHue: number;
}

// ─── WCAG luminance / contrast helpers ────────────────────────────────────

/** Relative luminance from sRGB channels (each 0–1). */
function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** WCAG 2.1 contrast ratio between two (r,g,b) colours (each channel 0–1). */
function contrastRatio(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const y1 = relativeLuminance(r1, g1, b1);
  const y2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(y1, y2);
  const darker  = Math.min(y1, y2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Convert an oklch CSS string back to {r,g,b} 0–1 for contrast checks. */
function cssOklchToRgb(css: string): { r: number; g: number; b: number } {
  // "oklch(L C H)" or "oklch(L C H / A)"
  const m = css.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return { r: 0, g: 0, b: 0 };
  return oklchToRgb(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
}

/** Parse a 6-digit hex string (#RRGGBB) to {r,g,b} 0–1. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const v = parseInt(hex.slice(1), 16);
  return {
    r: ((v >> 16) & 0xff) / 255,
    g: ((v >>  8) & 0xff) / 255,
    b:  (v        & 0xff) / 255,
  };
}

// ─── Hue of TUNGSTEN (#FFB04A) ─────────────────────────────────────────────

function tungstenHue(): number {
  const { r, g, b } = hexToRgb(TUNGSTEN);
  return rgbToOklch(r / 255 * 255 / 255, g / 255, b / 255).h;
}

// Pre-compute once; we reuse it for RESTING_THEME.
const TUNGSTEN_HUE = (() => {
  const hex = TUNGSTEN.slice(1);
  const v = parseInt(hex, 16);
  const r = ((v >> 16) & 0xff) / 255;
  const g = ((v >>  8) & 0xff) / 255;
  const b =  (v        & 0xff) / 255;
  return rgbToOklch(r, g, b).h;
})();

// ─── Core algorithm ────────────────────────────────────────────────────────

/**
 * Build a SpillTheme from an ImageData (e.g. a 16×9 video frame sample).
 */
export function deriveTheme(imageData: ImageData): SpillTheme {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  // ── 1. Convert all pixels to OKLCH ────────────────────────────────────
  const NUM_BUCKETS = 12;
  const bucketWeight = new Float64Array(NUM_BUCKETS);
  let chromaSum = 0;
  let chromaCount = 0;

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    const r = data[offset    ] / 255;
    const g = data[offset + 1] / 255;
    const b = data[offset + 2] / 255;

    const { l, c, h } = rgbToOklch(r, g, b);

    // Weight hue bucket by chroma
    if (l > 0 || c > 0) {
      const bucket = Math.floor(((h % 360) + 360) % 360 / 30) % NUM_BUCKETS;
      bucketWeight[bucket] += c;
    }

    // Accumulate for avgChroma (non-black pixels only)
    if (l > 0.1) {
      chromaSum += c;
      chromaCount++;
    }
  }

  const avgChroma = chromaCount > 0 ? chromaSum / chromaCount : 0;

  // ── 2. Derive key & fill hues ──────────────────────────────────────────
  let keyHue: number;
  let fillHue: number;

  if (avgChroma < 0.03) {
    keyHue = TUNGSTEN_HUE;
    fillHue = (keyHue + 150) % 360;
  } else {
    // Heaviest bucket → keyHue
    let maxWeight = -1;
    let keyBucket = 0;
    for (let i = 0; i < NUM_BUCKETS; i++) {
      if (bucketWeight[i] > maxWeight) {
        maxWeight = bucketWeight[i];
        keyBucket = i;
      }
    }
    keyHue = keyBucket * 30 + 15; // bucket center

    // Fill: heaviest bucket at least 60° away
    let fillWeight = -1;
    let fillBucket = -1;
    for (let i = 0; i < NUM_BUCKETS; i++) {
      if (i === keyBucket) continue;
      const bucketCenter = i * 30 + 15;
      if (hueDistance(keyHue, bucketCenter) >= 60 && bucketWeight[i] > fillWeight) {
        fillWeight = bucketWeight[i];
        fillBucket = i;
      }
    }

    fillHue = fillBucket >= 0 ? fillBucket * 30 + 15 : (keyHue + 150) % 360;
  }

  // ── 3. Build raw colour tokens ─────────────────────────────────────────
  const keyC   = clampNum(avgChroma * 1.6, 0.06, 0.16);
  const fillC  = clampNum(avgChroma * 1.3, 0.05, 0.14);

  let keyL  = 0.78;
  let panelL = 0.19;

  let key   = oklchToCss(keyL,   keyC,  keyHue);
  const fill  = oklchToCss(0.70,   fillC, fillHue);
  let panel = oklchToCss(panelL, 0.02,  keyHue);
  const room  = oklchToCss(0.14,   0.025, keyHue);

  // ── 4. Ensure contrast ─────────────────────────────────────────────────
  const { r: dr, g: dg, b: db } = hexToRgb(DIFFUSION);

  // 4a. DIFFUSION (#F4ECDF) on panel ≥ 4.5:1 — darken panel
  for (let iter = 0; iter < 50; iter++) {
    const { r: pr, g: pg, b: pb } = cssOklchToRgb(panel);
    if (contrastRatio(dr, dg, db, pr, pg, pb) >= 4.5) break;
    panelL = Math.max(0, panelL - 0.01);
    panel = oklchToCss(panelL, 0.02, keyHue);
  }

  // 4b. key on panel ≥ 3.0:1 — adjust key lightness
  for (let iter = 0; iter < 50; iter++) {
    const { r: kr, g: kg, b: kb } = cssOklchToRgb(key);
    const { r: pr, g: pg, b: pb } = cssOklchToRgb(panel);
    if (contrastRatio(kr, kg, kb, pr, pg, pb) >= 3.0) break;
    keyL = Math.min(1, keyL + 0.01);
    key = oklchToCss(keyL, keyC, keyHue);
  }

  const rim = oklchToCss(keyL, keyC, keyHue, 0.35);

  return { key, fill, room, panel, rim, keyHue, fillHue };
}

// ─── Colour distance ──────────────────────────────────────────────────────

/**
 * Euclidean distance on the OKLCH values of the `key` channel.
 * Returns a dimensionless scalar; > 0.08 is a meaningful change.
 */
export function colorDistance(a: SpillTheme, b: SpillTheme): number {
  const pa = cssOklchToRgb(a.key);
  const pb = cssOklchToRgb(b.key);
  const oklA = rgbToOklch(pa.r, pa.g, pa.b);
  const oklB = rgbToOklch(pb.r, pb.g, pb.b);

  const dl = oklA.l - oklB.l;
  const dc = oklA.c - oklB.c;
  const dh = hueDistance(oklA.h, oklB.h) / 180; // normalise to [0,1]
  return Math.sqrt(dl * dl + dc * dc + dh * dh);
}

// ─── Resting theme ────────────────────────────────────────────────────────

/**
 * Resting SPILL theme derived from the TUNGSTEN hue.
 * This matches the CSS defaults in skin.css.
 */
export const RESTING_THEME: SpillTheme = (() => {
  // Build a minimal synthetic ImageData-like structure to drive deriveTheme,
  // but it's simpler (and more reliable) to construct the theme directly.
  const keyHue  = TUNGSTEN_HUE;
  const fillHue = (keyHue + 150) % 360;
  const keyL    = 0.78;
  const keyC    = clampNum(0.12, 0.06, 0.16); // resting chroma mirrors skin.css
  const fillC   = clampNum(0.10, 0.05, 0.14);
  const panelL  = 0.19;

  const key   = oklchToCss(keyL,   keyC,  keyHue);
  const fill  = oklchToCss(0.70,   fillC, fillHue);
  const room  = oklchToCss(0.14,   0.025, keyHue);
  const panel = oklchToCss(panelL, 0.02,  keyHue);
  const rim   = oklchToCss(keyL,   keyC,  keyHue, 0.35);

  return { key, fill, room, panel, rim, keyHue, fillHue };
})();
