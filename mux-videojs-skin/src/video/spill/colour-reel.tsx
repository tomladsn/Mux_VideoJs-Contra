/** @jsxImportSource react */

import {
  useState,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from 'react';
import {
  TimeSlider as TimeSliderPrimitive,
  Slider as SliderPrimitive,
  useMedia,
  getMediaElement,
} from '@videojs/react';

import { cn } from '@/lib/resolve-class-name';
import { rgbToOklch, oklchToCss, hueDistance } from './tokens';
import { MUX_PLAYBACK_ID } from '@/config/mux';
import type { ThumbnailSlot } from '../shared/time-slider';

export interface ColourReelProps extends ThumbnailSlot {
  /** Mux playback ID for storyboard fetch */
  playbackId?: string;
  audio?: boolean;
}

interface MuxStoryboardTile {
  start: number;
  x: number;
  y: number;
  w?: number;
  h?: number;
  end?: number;
}

interface MuxStoryboardData {
  url?: string;
  tile_width?: number;
  tile_height?: number;
  duration?: number;
  tiles: MuxStoryboardTile[];
}

function parseColorToOklch(colorStr: string): { l: number; c: number; h: number } {
  if (!colorStr) return { l: 0, c: 0, h: 0 };
  const oklchMatch = colorStr.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (oklchMatch) {
    return {
      l: parseFloat(oklchMatch[1]),
      c: parseFloat(oklchMatch[2]),
      h: parseFloat(oklchMatch[3]),
    };
  }
  const rgbMatch = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    return rgbToOklch(
      parseInt(rgbMatch[1], 10) / 255,
      parseInt(rgbMatch[2], 10) / 255,
      parseInt(rgbMatch[3], 10) / 255
    );
  }
  return { l: 0, c: 0, h: 0 };
}

function colorDistanceOklch(c1: string, c2: string): number {
  const oklA = parseColorToOklch(c1);
  const oklB = parseColorToOklch(c2);
  const dl = oklA.l - oklB.l;
  const dc = oklA.c - oklB.c;
  const dh = hueDistance(oklA.h, oklB.h) / 180;
  return Math.sqrt(dl * dl + dc * dc + dh * dh);
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const DEFAULT_NEON_PALETTE = [
  '#4a1b52', '#5d2066', '#75257a', '#91298a', '#b22f96',
  '#d4379a', '#fa4595', '#ff5a8d', '#ff7284', '#ff8f80',
  '#ffaf85', '#ffd199', '#ffe9b8', '#fff8dc', '#c5e3ea',
  '#78b5c9', '#418ca4', '#266882', '#1a4e66', '#153b50',
  '#132c3f', '#152538', '#1a2233', '#251e36', '#351b3b',
  '#481940', '#5c1743', '#701542', '#501738', '#381230'
];

function buildDefaultColors(count = 120): string[] {
  const result: string[] = [];
  const P = DEFAULT_NEON_PALETTE.length;
  for (let i = 0; i < count; i++) {
    const idx = Math.min(P - 1, Math.floor((i / count) * P));
    result.push(DEFAULT_NEON_PALETTE[idx]);
  }
  return result;
}

export function ColourReel({
  playbackId,
  renderThumbnail,
  audio = false,
}: ColourReelProps) {
  const targetPlaybackId = playbackId || MUX_PLAYBACK_ID;
  const media = useMedia();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = getMediaElement(media);
    if (!el) return;
    const updateTime = () => {
      setCurrentTime(el.currentTime || 0);
      setDuration(el.duration || 0);
    };
    updateTime();
    el.addEventListener('timeupdate', updateTime);
    el.addEventListener('durationchange', updateTime);
    el.addEventListener('loadedmetadata', updateTime);
    return () => {
      el.removeEventListener('timeupdate', updateTime);
      el.removeEventListener('durationchange', updateTime);
      el.removeEventListener('loadedmetadata', updateTime);
    };
  }, [media]);

  // 120 visual slices along the timeline with instant sunset default
  const [reelColors, setReelColors] = useState<(string | null)[]>(() =>
    buildDefaultColors(120)
  );
  const [storyboardLoaded, setStoryboardLoaded] = useState(false);
  const [bufferedRanges, setBufferedRanges] = useState<
    { startPct: number; widthPct: number }[]
  >([]);

  // ── 1. Fetch Mux storyboard & pre-build Colour Reel ────────────────────────
  useEffect(() => {
    if (!targetPlaybackId) return;

    let aborted = false;
    const jsonUrl = `https://image.mux.com/${targetPlaybackId}/storyboard.json`;

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Storyboard fetch failed: ${res.status}`);
        return res.json() as Promise<MuxStoryboardData>;
      })
      .then((data) => {
        if (aborted) return;
        const tiles = data.tiles;
        if (!tiles || tiles.length === 0) return;

        const tileWidth = data.tile_width ?? 284;
        const tileHeight = data.tile_height ?? 160;
        const totalDur =
          data.duration ||
          duration ||
          (tiles[tiles.length - 1].end ?? tiles[tiles.length - 1].start + 2);

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          if (aborted) return;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Sample each tile's average color
            const tileColors: string[] = [];
            for (let t = 0; t < tiles.length; t++) {
              const tile = tiles[t];
              const tw = tile.w ?? tileWidth;
              const th = tile.h ?? tileHeight;
              ctx.clearRect(0, 0, 1, 1);
              ctx.drawImage(img, tile.x, tile.y, tw, th, 0, 0, 1, 1);
              const pixel = ctx.getImageData(0, 0, 1, 1).data;
              const { l, c, h } = rgbToOklch(
                pixel[0] / 255,
                pixel[1] / 255,
                pixel[2] / 255
              );
              tileColors.push(oklchToCss(l, c, h));
            }

            // Map N=120 slices to tile colors
            const N = 120;
            const colors: string[] = [];
            for (let i = 0; i < N; i++) {
              const slotTime = ((i + 0.5) / N) * totalDur;
              let tileIndex = 0;
              for (let j = 0; j < tiles.length; j++) {
                if (tiles[j].start <= slotTime) {
                  tileIndex = j;
                } else {
                  break;
                }
              }
              colors.push(tileColors[tileIndex]);
            }

            setReelColors(colors);
            setStoryboardLoaded(true);
          } catch {
            // CORS or canvas extraction failed; progressive sampling takes over
          }
        };

        img.src = data.url || `https://image.mux.com/${targetPlaybackId}/storyboard.png`;
      })
      .catch(() => {
        // Fetch failed; progressive sampling fallback
      });

    return () => {
      aborted = true;
    };
  }, [targetPlaybackId, duration]);

  // ── 2. Attach storyboard WebVTT track for preview thumbnails ─────────────
  useEffect(() => {
    if (!targetPlaybackId) return;
    const videoEl = getMediaElement(media);
    if (!videoEl) return;

    const existing = Array.from(videoEl.querySelectorAll('track')).find(
      (t) => t.kind === 'thumbnails'
    );
    if (!existing) {
      const track = document.createElement('track');
      track.kind = 'thumbnails';
      track.src = `https://image.mux.com/${targetPlaybackId}/storyboard.vtt`;
      track.default = true;
      videoEl.appendChild(track);
      return () => {
        if (track.parentNode) {
          track.parentNode.removeChild(track);
        }
      };
    }
  }, [media, targetPlaybackId]);

  // ── 3. Progressive sampling fallback ─────────────────────────────────────
  useEffect(() => {
    if (storyboardLoaded) return;
    const videoEl = getMediaElement(media);
    if (!videoEl) return;

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 1;
    sampleCanvas.height = 1;
    const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sCtx) return;

    const onTimeUpdate = () => {
      const cur = videoEl.currentTime;
      const dur = videoEl.duration;
      if (!dur || dur <= 0) return;

      const N = 120;
      const slot = Math.min(N - 1, Math.max(0, Math.floor((cur / dur) * N)));

      setReelColors((prev) => {
        if (prev[slot] !== null) return prev;
        try {
          if (videoEl instanceof HTMLVideoElement) {
            sCtx.drawImage(videoEl, 0, 0, 1, 1);
            const p = sCtx.getImageData(0, 0, 1, 1).data;
            const { l, c, h } = rgbToOklch(p[0] / 255, p[1] / 255, p[2] / 255);
            const col = oklchToCss(l, c, h);
            const next = [...prev];
            next[slot] = col;
            return next;
          }
          return prev;
        } catch {
          return prev;
        }
      });
    };

    videoEl.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [media, storyboardLoaded]);

  // ── 4. Track buffered ranges ─────────────────────────────────────────────
  useEffect(() => {
    const videoEl = getMediaElement(media);
    if (!videoEl) return;

    const updateBuffer = () => {
      const b = videoEl.buffered;
      const dur = videoEl.duration;
      if (!b || !dur || dur <= 0) return;
      const ranges: { startPct: number; widthPct: number }[] = [];
      for (let i = 0; i < b.length; i++) {
        const start = b.start(i);
        const end = b.end(i);
        const startPct = Math.max(0, Math.min(100, (start / dur) * 100));
        const widthPct = Math.max(
          0,
          Math.min(100 - startPct, ((end - start) / dur) * 100)
        );
        ranges.push({ startPct, widthPct });
      }
      setBufferedRanges(ranges);
    };

    videoEl.addEventListener('progress', updateBuffer);
    videoEl.addEventListener('timeupdate', updateBuffer);
    updateBuffer();

    return () => {
      videoEl.removeEventListener('progress', updateBuffer);
      videoEl.removeEventListener('timeupdate', updateBuffer);
    };
  }, [media]);

  // ── 5. Generate linear-gradient of N=120 colour stops ────────────────────
  const gradientBg = useMemo(() => {
    const stops: string[] = [];
    const N = 120;
    for (let i = 0; i < N; i++) {
      const color = reelColors[i] || 'transparent';
      const startPct = ((i / N) * 100).toFixed(3);
      const endPct = (((i + 1) / N) * 100).toFixed(3);
      stops.push(`${color} ${startPct}%`, `${color} ${endPct}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [reelColors]);

  // ── 6. Shot-change ticks where colour distance spikes (> 0.15) ───────────
  const shotChangeIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 1; i < reelColors.length; i++) {
      const prev = reelColors[i - 1];
      const curr = reelColors[i];
      if (!prev || !curr) continue;
      if (colorDistanceOklch(prev, curr) > 0.15) {
        indices.push(i);
      }
    }
    return indices;
  }, [reelColors]);

  // ── 7. Shift+Left/Right for shot-change jumping ──────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      if (!duration || duration <= 0 || shotChangeIndices.length === 0) return;
      const curTime = currentTime || 0;

      if (e.key === 'ArrowRight') {
        const nextIdx = shotChangeIndices.find(
          (idx) => (idx / 120) * duration > curTime + 0.3
        );
        if (nextIdx !== undefined) {
          const targetTime = (nextIdx / 120) * duration;
          const videoEl = getMediaElement(media);
          if (videoEl) videoEl.currentTime = targetTime;
          e.preventDefault();
          e.stopPropagation();
        }
      } else if (e.key === 'ArrowLeft') {
        const prevIdx = [...shotChangeIndices]
          .reverse()
          .find((idx) => (idx / 120) * duration < curTime - 0.3);
        const targetTime =
          prevIdx !== undefined ? (prevIdx / 120) * duration : 0;
        const videoEl = getMediaElement(media);
        if (videoEl) videoEl.currentTime = targetTime;
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  return (
    <div className="w-full">
      <TimeSliderPrimitive.Root
        className={cn(
          'group/slider relative flex h-11 md:h-6 min-w-12 flex-1 cursor-pointer items-center py-2 md:py-1.5 outline-none touch-none',
          'data-disabled:cursor-not-allowed data-disabled:opacity-40 forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100'
        )}
        thumbAlignment="edge"
        role="slider"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        onKeyDown={handleKeyDown}
      >
        {/* Track visual layer (large 20px on mobile for thumb accessibility, 14px on desktop) */}
        <TimeSliderPrimitive.Track
          className={cn(
            'relative isolate h-5 md:h-3.5 w-full overflow-hidden rounded-[4px] md:rounded-[3px]',
            // Neutral hatch background for unsampled slots
            'bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_4px,rgba(0,0,0,0.3)_4px,rgba(0,0,0,0.3)_8px)]'
          )}
        >
          {/* N=120 colour stops track */}
          <div
            className="absolute inset-0 size-full pointer-events-none"
            style={{ background: gradientBg }}
          />

          {/* Unplayed portion: 55% brightness overlay (45% black overlay from playhead to end) */}
          <div
            className={cn(
              'absolute inset-0 size-full pointer-events-none bg-black/45 transition-[clip-path] duration-75',
              'group-data-dragging/slider:[clip-path:inset(0_0_0_var(--media-slider-pointer,0%))]'
            )}
            style={{ clipPath: 'inset(0 0 0 var(--media-slider-fill, 0%))' }}
          />

          {/* Shot-change ticks: 2px wide × 1px tall marks */}
          {shotChangeIndices.map((idx) => (
            <div
              key={idx}
              className="absolute top-0 z-10 h-0.5 w-[2px] -translate-x-1/2 pointer-events-none bg-[var(--spill-diffusion,#F4ECDF)] opacity-85 shadow-[0_0_2px_rgba(0,0,0,0.6)]"
              style={{ left: `${(idx / 120) * 100}%` }}
            />
          ))}

          {/* Buffered ranges underline (2px tall at bottom) */}
          {bufferedRanges.length > 0 ? (
            bufferedRanges.map((range, i) => (
              <div
                key={i}
                className="absolute bottom-0 z-10 h-[2px] rounded-full bg-[var(--spill-fill,#5eead4)] shadow-[0_0_4px_var(--spill-fill,rgba(94,234,212,0.6))]"
                style={{
                  left: `${range.startPct}%`,
                  width: `${range.widthPct}%`,
                }}
              />
            ))
          ) : (
            <div
              className="absolute bottom-0 z-10 h-[2px] rounded-full bg-[var(--spill-fill,#5eead4)] shadow-[0_0_4px_var(--spill-fill,rgba(94,234,212,0.6))]"
              style={{ left: 0, width: 'var(--media-slider-buffer, 0%)' }}
            />
          )}

          {/* Primitives for videojs slider state */}
          <TimeSliderPrimitive.Buffer className="sr-only" />
          <TimeSliderPrimitive.Fill className="sr-only" />
        </TimeSliderPrimitive.Track>

        {/* Scrubber thumb: 4px wide × 20px tall, glows in pink accent */}
        <TimeSliderPrimitive.Thumb
          className={cn(
            'absolute top-1/2 left-[var(--media-slider-fill,0%)] -translate-x-1/2 -translate-y-1/2',
            'h-5 w-1 rounded-[2px]',
            'bg-[#FF5C8A]',
            'shadow-[0_0_10px_2px_rgba(255,92,138,0.85)]',
            'transition-transform duration-100 hover:scale-110 active:scale-125',
            'group-data-dragging/slider:left-(--media-slider-pointer) group-data-dragging/slider:scale-110',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C8A]'
          )}
        />

        {/* Hover / drag preview card */}
        <TimeSliderPrimitive.Preview
          className={cn(
            'pointer-events-none bottom-[calc(100%+var(--media-spacing)*3)] grid max-w-44 origin-bottom justify-items-center gap-1.5',
            'opacity-0 transition-opacity duration-150 group-data-disabled/slider:hidden',
            'group-data-dragging/slider:opacity-100 group-data-pointing/slider:opacity-100'
          )}
        >
          {/* Show thumbnail if storyboard is loaded or custom thumbnail renderer provided */}
          {(storyboardLoaded || renderThumbnail) && (
            <SliderPrimitive.Thumbnail.Root
              className="block max-w-44 overflow-hidden rounded-xl border border-white/20 bg-neutral-950/90 p-1 shadow-2xl backdrop-blur-md"
            >
              <SliderPrimitive.Thumbnail.Image
                render={renderThumbnail}
                className="block rounded-lg"
              />
            </SliderPrimitive.Thumbnail.Root>
          )}

          {/* Time + chapter label */}
          <div
            className={cn(
              'flex w-full min-w-0 justify-center rounded-lg border border-white/15 bg-neutral-950/90 px-2.5 py-1 text-xs text-white shadow-xl backdrop-blur-md',
              audio &&
                'w-auto! rounded-lg px-1.5! py-0.5 media-high-contrast:outline forced-colors:outline'
            )}
          >
            <div className="flex max-w-full min-w-0 items-center gap-2">
              <TimeSliderPrimitive.Value
                className="shrink-0 font-mono font-medium tabular-nums text-[var(--spill-key,#FFB04A)]"
                type="pointer"
              />
              <TimeSliderPrimitive.ChapterTitle className="min-w-0 truncate text-white/70 empty:hidden" />
            </div>
          </div>
        </TimeSliderPrimitive.Preview>
      </TimeSliderPrimitive.Root>
    </div>
  );
}
