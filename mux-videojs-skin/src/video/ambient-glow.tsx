/** @jsxImportSource react */

'use client';

// Full SPILL ambient engine — replaces the old canvas-inside-player approach
// Architecture:
// - Offscreen 16x9 canvas samples video frames
// - deriveTheme() extracts OKLCH colour palette
// - CSS vars set on :root AND .media-skin element
// - Box-shadow on .media-skin for the glow (works with overflow-hidden + border-radius)
// - Separate visible canvas OUTSIDE player for the blurred glow (placed by parent)
// - Page background uses radial-gradient from --spill-room + --spill-key
// - Glow toggle: Off | Soft | Full (localStorage: "spill-glow-mode")
// - prefers-reduced-motion: instant steps on shot change, no transitions
// - CORS fallback: catch getImageData errors → use resting tungsten theme
// - Pause loop when: video paused >2s, tab hidden, or glow=Off
// - 8fps on desktop, 4fps on mobile (matchMedia max-width: 768px)
// - Stability: only commit new theme if colorDistance > threshold OR every 1s max

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMedia, getMediaElement } from '@videojs/react';

import { clampNum, oklchToRgb } from './spill/tokens';
import {
  deriveTheme,
  colorDistance,
  RESTING_THEME,
  type SpillTheme,
} from './spill/theme-engine';

export type GlowMode = 'off' | 'soft' | 'full';

const STORAGE_KEY = 'spill-glow-mode';
const GLOW_CHANGE_EVENT = 'spill-glow-mode-change';

function getStoredGlowMode(): GlowMode {
  if (typeof window === 'undefined') return 'full';
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'off' || val === 'soft' || val === 'full') return val;
  } catch {
    // localStorage may throw in restricted sandboxes
  }
  return 'full';
}

/**
 * Set the ambient glow mode explicitly. Writes storage and notifies every
 * `useGlowMode` consumer (including the ambient sampling engine).
 */
export function setGlowMode(mode: GlowMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage may throw in restricted sandboxes
  }
  window.dispatchEvent(new Event(GLOW_CHANGE_EVENT));
}

/**
 * Hook to read and cycle the ambient glow mode (Off → Soft → Full → Off).
 * Synchronized across components via custom event and storage events.
 */
export function useGlowMode(): ['off' | 'soft' | 'full', () => void] {
  const [mode, setMode] = useState<GlowMode>(getStoredGlowMode);

  useEffect(() => {
    const syncMode = () => {
      setMode(getStoredGlowMode());
    };
    window.addEventListener('storage', syncMode);
    window.addEventListener(GLOW_CHANGE_EVENT, syncMode);
    return () => {
      window.removeEventListener('storage', syncMode);
      window.removeEventListener(GLOW_CHANGE_EVENT, syncMode);
    };
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      let next: GlowMode;
      if (prev === 'off') next = 'soft';
      else if (prev === 'soft') next = 'full';
      else next = 'off';

      setGlowMode(next);
      return next;
    });
  }, []);

  return [mode, toggle];
}

// ─── Color Helpers ──────────────────────────────────────────────────────────

function parseOklch(str: string): { l: number; c: number; h: number } | null {
  const m = str.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) return null;
  return { l: parseFloat(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]) };
}

function oklchStringToHex(cssOklch: string, alpha?: number): string {
  const parsed = parseOklch(cssOklch);
  if (!parsed) return '#000000';
  const { r, g, b } = oklchToRgb(parsed.l, parsed.c, parsed.h);
  const rHex = Math.round(clampNum(r, 0, 1) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round(clampNum(g, 0, 1) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round(clampNum(b, 0, 1) * 255).toString(16).padStart(2, '0');
  if (alpha !== undefined) {
    const aHex = Math.round(clampNum(alpha, 0, 1) * 255).toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}${aHex}`;
  }
  return `#${rHex}${gHex}${bHex}`;
}

function oklchStringToRgba(cssOklch: string, alpha: number): string {
  const parsed = parseOklch(cssOklch);
  if (!parsed) return `rgba(0, 0, 0, ${alpha})`;
  const { r, g, b } = oklchToRgb(parsed.l, parsed.c, parsed.h);
  const r255 = Math.round(clampNum(r, 0, 1) * 255);
  const g255 = Math.round(clampNum(g, 0, 1) * 255);
  const b255 = Math.round(clampNum(b, 0, 1) * 255);
  const clampedA = clampNum(alpha, 0, 1);
  return `rgba(${r255}, ${g255}, ${b255}, ${clampedA.toFixed(3)})`;
}

let activeBgOverride: string | null = null;

/** Optional helper for external components (e.g. Programme cards) to temporarily override the room background. */
export function setAmbientBackgroundOverride(bg: string | null): void {
  activeBgOverride = bg;
  if (typeof document !== 'undefined' && document.body) {
    if (bg) {
      document.body.style.background = bg;
    }
  }
}

// ─── Theme Application ─────────────────────────────────────────────────────

function applySpillTheme(theme: SpillTheme, mode: GlowMode) {
  if (typeof document === 'undefined') return;

  // 1. Set CSS vars on documentElement (:root)
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--spill-key', theme.key);
  rootStyle.setProperty('--spill-fill', theme.fill);
  rootStyle.setProperty('--spill-room', theme.room);
  rootStyle.setProperty('--spill-panel', theme.panel);
  rootStyle.setProperty('--spill-rim', theme.rim);

  // Also expose the film key colour for the landing.css subtle dark ambient gradients.
  // These are very low-opacity radial-gradients built into .spill-app-root[data-cinema="true"]
  // and are intentionally subtle — the page bg stays near-black in all cases.
  const keyAlpha = 0.15 * (mode === 'full' ? 1.0 : mode === 'soft' ? 0.5 : 0);
  const { r, g, b } = (() => {
    const parsed = theme.key.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (!parsed) return { r: 255, g: 92, b: 138 };
    const { r: rr, g: gg, b: bb } = oklchToRgb(parseFloat(parsed[1]), parseFloat(parsed[2]), parseFloat(parsed[3]));
    return { r: Math.round(rr * 255), g: Math.round(gg * 255), b: Math.round(bb * 255) };
  })();
  rootStyle.setProperty('--film-ambient-glow', `rgba(${r}, ${g}, ${b}, ${keyAlpha.toFixed(3)})`);

  // 2. Set CSS vars and box-shadow on .media-skin and its container
  const skinEl = document.querySelector('.media-skin') as HTMLElement | null;
  const isFullscreen = !!(document.fullscreenElement || (document as { webkitFullscreenElement?: Element }).webkitFullscreenElement);
  const glowMultiplier = mode === 'full' ? 1.0 : mode === 'soft' ? 0.5 : 0;

  if (skinEl) {
    skinEl.style.setProperty('--spill-key', theme.key);
    skinEl.style.setProperty('--spill-fill', theme.fill);
    skinEl.style.setProperty('--spill-room', theme.room);
    skinEl.style.setProperty('--spill-panel', theme.panel);
    skinEl.style.setProperty('--spill-rim', theme.rim);

    if (glowMultiplier === 0 || isFullscreen) {
      skinEl.style.boxShadow = 'none';
    } else {
      const keyShadow = oklchStringToHex(theme.key, 0.4 * glowMultiplier);
      const fillShadow = oklchStringToHex(theme.fill, 0.2 * glowMultiplier);
      const shadowValue = `0 0 60px 20px ${keyShadow}, 0 0 120px 40px ${fillShadow}`;

      skinEl.style.boxShadow = shadowValue;
      // Do NOT set box-shadow on parent element because in React DOM layouts (or if hero is parent)
      // it would leak box-shadow onto .spill-hero-left or other layout wrappers!
    }
  }

  // 3. Page background: intentionally NOT overriding body.style.background with a colourful
  // radial-gradient. The design intent is a pure dark room (#0C0A10) where the VIDEO itself
  // illuminates the space via the box-shadow glow on .media-skin edges. A coloured body-bg
  // gradient fights the video instead of letting it breathe. The CSS on .spill-app-root
  // already handles the dark cinema background correctly.
  //
  // CSS vars (--spill-key, --spill-room, --film-ambient-glow) are still set on :root above
  // so landing.css radial-gradients remain reactive to the film colour without painting over
  // the whole body background.
  if (!activeBgOverride && document.body) {
    // Keep body background clean — only clear any previously-set inline style
    if (document.body.style.background) {
      document.body.style.background = '';
    }
  }

  // 4. Update <meta name="theme-color">
  try {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme.room;
  } catch {
    // ignore
  }
}

// ─── AmbientGlow Component ─────────────────────────────────────────────────

export interface AmbientGlowProps {
  enabled?: boolean;
  className?: string; // keep for compat
  opacity?: number; // keep for compat
}

export function AmbientGlow({ enabled = true }: AmbientGlowProps): null {
  const media = useMedia();
  const [glowMode, toggleGlowMode] = useGlowMode();

  const currentThemeRef = useRef<SpillTheme>(RESTING_THEME);
  const lastAppliedTimeRef = useRef<number>(0);
  const glowModeRef = useRef<GlowMode>(glowMode);
  glowModeRef.current = glowMode;

  const enabledRef = useRef<boolean>(enabled);
  enabledRef.current = enabled;

  // Listen for 'g' / 'G' keydown to cycle glow mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        toggleGlowMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleGlowMode]);

  // Update theme presentation immediately when glow mode or enabled changes
  useEffect(() => {
    const effectiveMode = enabled ? glowMode : 'off';
    applySpillTheme(currentThemeRef.current, effectiveMode);
  }, [glowMode, enabled]);

  // Fullscreen change listener to clear / restore box-shadow
  useEffect(() => {
    const handleFullscreenChange = () => {
      const effectiveMode = enabledRef.current ? glowModeRef.current : 'off';
      applySpillTheme(currentThemeRef.current, effectiveMode);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Main sampling loop
  useEffect(() => {
    if (!enabled) {
      applySpillTheme(RESTING_THEME, 'off');
      return;
    }

    // Initialize with resting theme
    applySpillTheme(currentThemeRef.current, glowModeRef.current);

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 9;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let animId = 0;
    let isRunning = false;
    let pausedSince: number | null = null;
    let lastSampleTimestamp = 0;
    let currentVideoEl: HTMLVideoElement | null = null;

    const getVideo = (): HTMLVideoElement | null => {
      const el = getMediaElement(media);
      if (el instanceof HTMLVideoElement) return el;
      if (el && 'querySelector' in (el as unknown as Record<string, unknown>)) {
        const v = (el as HTMLElement).querySelector('video');
        if (v instanceof HTMLVideoElement) return v;
      }
      return (
        (document.querySelector('.media-skin video') as HTMLVideoElement | null) ??
        (document.querySelector('video') as HTMLVideoElement | null)
      );
    };

    const sampleFrame = (video: HTMLVideoElement) => {
      if (!ctx || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      let newTheme: SpillTheme;
      try {
        ctx.drawImage(video, 0, 0, 16, 9);
        const imageData = ctx.getImageData(0, 0, 16, 9);
        newTheme = deriveTheme(imageData);
      } catch {
        // CORS fallback: catch getImageData errors → use resting tungsten theme
        newTheme = RESTING_THEME;
      }

      const dist = colorDistance(currentThemeRef.current, newTheme);
      const now = performance.now();
      if (
        dist > 0.08 ||
        now - lastAppliedTimeRef.current >= 1000 ||
        lastAppliedTimeRef.current === 0
      ) {
        currentThemeRef.current = newTheme;
        lastAppliedTimeRef.current = now;
        applySpillTheme(newTheme, glowModeRef.current);
      }
    };

    const loop = (timestamp: number) => {
      if (!isRunning) return;

      const activeGlowMode = glowModeRef.current;
      if (activeGlowMode === 'off' || !enabledRef.current || document.hidden) {
        isRunning = false;
        return;
      }

      const video = getVideo();
      if (!video) {
        // Retry shortly
        animId = requestAnimationFrame(loop);
        return;
      }

      // Attach event listeners to video if changed
      if (video !== currentVideoEl) {
        detachVideoListeners();
        currentVideoEl = video;
        attachVideoListeners(video);
      }

      // Check pause timeout: pauses when video.paused && pausedFor > 2000ms
      if (video.paused) {
        const now = performance.now();
        if (pausedSince === null) {
          pausedSince = now;
        } else if (now - pausedSince > 2000) {
          isRunning = false;
          return;
        }
      } else {
        pausedSince = null;
      }

      // 8fps on desktop, 4fps on mobile (matchMedia max-width: 768px)
      // Soft mode: 4fps always
      const isMobile =
        typeof window !== 'undefined' &&
        window.matchMedia('(max-width: 768px)').matches;
      const targetFps = activeGlowMode === 'soft' ? 4 : isMobile ? 4 : 8;
      const intervalMs = 1000 / targetFps;

      if (timestamp - lastSampleTimestamp >= intervalMs) {
        lastSampleTimestamp = timestamp;
        sampleFrame(video);
      }

      animId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      pausedSince = null;
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(loop);
      }
    };

    const onVideoActivity = () => {
      startLoop();
    };

    const attachVideoListeners = (v: HTMLVideoElement) => {
      v.addEventListener('play', onVideoActivity);
      v.addEventListener('playing', onVideoActivity);
      v.addEventListener('seeked', onVideoActivity);
      v.addEventListener('timeupdate', onVideoActivity);
      v.addEventListener('loadeddata', onVideoActivity);
    };

    const detachVideoListeners = () => {
      if (currentVideoEl) {
        currentVideoEl.removeEventListener('play', onVideoActivity);
        currentVideoEl.removeEventListener('playing', onVideoActivity);
        currentVideoEl.removeEventListener('seeked', onVideoActivity);
        currentVideoEl.removeEventListener('timeupdate', onVideoActivity);
        currentVideoEl.removeEventListener('loadeddata', onVideoActivity);
        currentVideoEl = null;
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && glowModeRef.current !== 'off' && enabledRef.current) {
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial kick-off
    startLoop();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      detachVideoListeners();
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup inline styles applied to body and skin element on unmount
      if (typeof document !== 'undefined') {
        if (document.body) {
          document.body.style.background = '';
        }
        const skinEl = document.querySelector('.media-skin') as HTMLElement | null;
        if (skinEl) {
          skinEl.style.boxShadow = '';
          if (skinEl.parentElement) {
            skinEl.parentElement.style.boxShadow = '';
          }
        }
        // Also ensure any leaked box-shadow on .spill-hero-left or other hero elements is cleared
        document.querySelectorAll<HTMLElement>('.spill-hero-left, .spill-preview-card-wrapper').forEach((el) => {
          el.style.boxShadow = '';
        });
      }
    };
  }, [enabled, media, glowMode]);

  return null;
}
