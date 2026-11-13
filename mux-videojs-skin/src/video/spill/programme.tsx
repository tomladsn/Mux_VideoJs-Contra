/** @jsxImportSource react */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGlowMode } from '../ambient-glow';

export interface ProgrammeItem {
  id: string;
  title: string;
  muxPlaybackId: string;
  duration: number; // seconds
  poster?: string; // URL
  dominantColour?: string; // CSS color hint
}

export interface ProgrammeProps {
  items: ProgrammeItem[];
  currentId: string;
  onSelect: (item: ProgrammeItem, startTime?: number) => void;
  className?: string;
}

/** Formats seconds into mm:ss */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function Programme({ items, currentId, onSelect, className = '' }: ProgrammeProps) {
  const [glowMode] = useGlowMode();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [resumePrompt, setResumePrompt] = useState<{
    item: ProgrammeItem;
    savedPos: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Read URL hash on initial mount (e.g. #2?t=35 or #2)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const [indexStr, queryStr] = hash.split('?');
    const index = parseInt(indexStr, 10) - 1;
    if (!isNaN(index) && items[index]) {
      let startTime = 0;
      if (queryStr) {
        const params = new URLSearchParams(queryStr);
        const t = parseFloat(params.get('t') ?? '0');
        if (!isNaN(t) && t > 0) startTime = t;
      }
      onSelect(items[index], startTime);
    }
  }, [items, onSelect]);

  // Track and save video playback position to localStorage periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
      if (video && !video.paused && video.currentTime > 5 && video.currentTime < video.duration - 5) {
        try {
          localStorage.setItem(`spill-pos-${currentId}`, String(Math.floor(video.currentTime)));
        } catch {
          // Ignore localStorage errors
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentId]);

  // Handle card click with resume check
  const handleItemClick = (item: ProgrammeItem) => {
    if (item.id === currentId) return;

    // Check saved position
    try {
      const saved = localStorage.getItem(`spill-pos-${item.id}`);
      if (saved) {
        const pos = parseInt(saved, 10);
        if (pos > 5 && pos < item.duration - 10) {
          setResumePrompt({ item, savedPos: pos });
          return;
        }
      }
    } catch {
      // Ignore
    }

    applySelection(item, 0);
  };

  const applySelection = (item: ProgrammeItem, startTime = 0) => {
    setResumePrompt(null);
    const index = items.findIndex((i) => i.id === item.id);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${index + 1}?t=${startTime}`;
    }
    onSelect(item, startTime);
  };

  // Card hover dominant colour tint
  const handleMouseEnter = (item: ProgrammeItem) => {
    if (glowMode === 'off' || !item.dominantColour) return;
    document.body.style.background = `radial-gradient(ellipse 80% 60% at 50% 50%, ${item.dominantColour} 0%, var(--spill-room, #0E0C0D) 60%)`;
  };

  const handleMouseLeave = () => {
    document.body.style.background = '';
  };

  // Horizontal scroll buttons
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -280 : 280;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Copy link to current moment
  const copyMomentLink = () => {
    if (typeof window === 'undefined') return;
    const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
    const currentTime = video ? Math.floor(video.currentTime) : 0;
    const currentIndex = items.findIndex((i) => i.id === currentId);
    const itemNum = currentIndex >= 0 ? currentIndex + 1 : 1;

    const url = new URL(window.location.href);
    url.hash = `#${itemNum}?t=${currentTime}`;

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section
      aria-label="Programme playlist"
      className={`relative w-full max-w-5xl mx-auto mt-6 text-[var(--spill-diffusion,#F4ECDF)] font-sans ${className}`}
    >
      {/* Header bar: title on desktop, controls */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-block text-xs font-mono font-semibold tracking-widest text-[var(--spill-tungsten,#FFB04A)] uppercase">
            PROGRAMME
          </span>
          <span className="text-xs text-[var(--spill-diffusion,#F4ECDF)]/60 font-mono">
            {items.findIndex((i) => i.id === currentId) + 1} / {items.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy link to moment button */}
          <button
            type="button"
            onClick={copyMomentLink}
            aria-label="Copy link to this moment"
            title="Copy link to this moment"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-full bg-[var(--spill-panel,#191517)] hover:bg-[var(--spill-panel,#191517)]/80 border border-[var(--spill-key,#FFB04A)]/30 hover:border-[var(--spill-key,#FFB04A)] text-[var(--spill-diffusion,#F4ECDF)] min-h-[44px] min-w-[44px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--spill-diffusion,#F4ECDF)]"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {/* Shelf scroll buttons (desktop) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll programme left"
              className="p-2 rounded-full bg-[var(--spill-panel,#191517)] hover:bg-[var(--spill-panel,#191517)]/80 text-[var(--spill-diffusion,#F4ECDF)] border border-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll programme right"
              className="p-2 rounded-full bg-[var(--spill-panel,#191517)] hover:bg-[var(--spill-panel,#191517)]/80 text-[var(--spill-diffusion,#F4ECDF)] border border-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Resume from saved position dialog chip */}
      {resumePrompt && (
        <div
          role="alert"
          className="mb-3 mx-2 p-3 rounded-lg bg-[var(--spill-panel,#191517)] border border-[var(--spill-key,#FFB04A)] text-sm flex flex-wrap items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="text-[var(--spill-tungsten,#FFB04A)] font-mono text-xs">RESUME</span>
            <span>
              Resume &ldquo;{resumePrompt.item.title}&rdquo; from{' '}
              <strong className="font-mono text-[var(--spill-key,#FFB04A)]">
                {formatDuration(resumePrompt.savedPos)}
              </strong>
              ?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applySelection(resumePrompt.item, resumePrompt.savedPos)}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[var(--spill-key,#FFB04A)] text-[var(--spill-blackwrap,#0E0C0D)] hover:opacity-90 min-h-[44px] min-w-[44px] font-mono font-bold transition-opacity"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={() => applySelection(resumePrompt.item, 0)}
              className="px-3 py-1.5 text-xs rounded bg-white/10 hover:bg-white/20 text-[var(--spill-diffusion,#F4ECDF)] min-h-[44px] min-w-[44px] font-mono transition-colors"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={() => setResumePrompt(null)}
              aria-label="Dismiss resume prompt"
              className="p-2 text-white/50 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Horizontally scrollable card track */}
      <div
        ref={scrollContainerRef}
        role="region"
        aria-label="Programme tracks"
        tabIndex={0}
        className="flex items-stretch gap-3 overflow-x-auto pb-3 px-2 scroll-smooth snap-x snap-mandatory focus-visible:outline-2 focus-visible:outline-[var(--spill-diffusion,#F4ECDF)]"
        style={{ scrollbarWidth: 'thin' }}
      >
        {items.map((item, index) => {
          const isActive = item.id === currentId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => handleMouseEnter(item)}
              onMouseLeave={handleMouseLeave}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`Track ${index + 1}: ${item.title}, ${formatDuration(item.duration)}`}
              className={`flex-none snap-start group relative flex flex-col text-left rounded-lg overflow-hidden bg-[var(--spill-panel,#191517)] transition-all duration-200 min-w-[140px] max-w-[160px] p-2 min-h-[44px] ${
                isActive
                  ? 'ring-2 ring-[var(--spill-key,#FFB04A)] border-[var(--spill-key,#FFB04A)] shadow-[0_0_15px_rgba(255,176,74,0.3)]'
                  : 'border border-white/10 hover:border-white/30 hover:bg-[var(--spill-panel,#191517)]/90'
              }`}
            >
              {/* Thumbnail 120x68px */}
              <div className="relative w-full h-[68px] rounded bg-black/60 overflow-hidden mb-2">
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: item.dominantColour ?? '#222' }}
                  />
                )}

                {/* Number badge */}
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75 text-[var(--spill-diffusion,#F4ECDF)]">
                  {index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>

                {/* Duration badge */}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/75 text-[var(--spill-diffusion,#F4ECDF)]/90">
                  {formatDuration(item.duration)}
                </span>

                {/* Playing indicator */}
                {isActive && (
                  <div className="absolute inset-0 bg-[var(--spill-key,#FFB04A)]/15 flex items-center justify-center">
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-[var(--spill-key,#FFB04A)] rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-[var(--spill-key,#FFB04A)] rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-[var(--spill-key,#FFB04A)] rounded-full animate-pulse delay-150" />
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <span className="text-xs font-medium text-[var(--spill-diffusion,#F4ECDF)] truncate w-full group-hover:text-white transition-colors">
                {item.title}
              </span>

              {/* Dominant colour dot */}
              {item.dominantColour && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: item.dominantColour }}
                  />
                  <span className="text-[10px] text-[var(--spill-diffusion,#F4ECDF)]/40 font-mono">
                    SPILL
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * AutoplayNext overlay component
 * Shows when video ends: "Up next: {title} in 5s" with countdown, Cancel (Esc) and "Play now" buttons
 */
export interface AutoplayNextProps {
  nextItem: ProgrammeItem | null;
  onSelect: (item: ProgrammeItem) => void;
  onCancel?: () => void;
}

export function AutoplayNext({ nextItem, onSelect, onCancel }: AutoplayNextProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (!nextItem || cancelled) return;

    setSecondsLeft(5);
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onSelect(nextItem);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearInterval(timer);
        setCancelled(true);
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextItem, cancelled, onSelect, onCancel]);

  if (!nextItem || cancelled || secondsLeft <= 0) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-label={`Up next: ${nextItem.title}`}
      className="absolute bottom-16 right-4 z-40 max-w-sm p-4 rounded-xl bg-[var(--spill-panel,#191517)]/95 border border-[var(--spill-key,#FFB04A)]/50 backdrop-blur-md shadow-2xl text-[var(--spill-diffusion,#F4ECDF)] animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--spill-tungsten,#FFB04A)]">
            UP NEXT IN {secondsLeft}S
          </span>
          <h4 className="text-sm font-semibold text-white truncate max-w-[200px] mt-0.5">
            {nextItem.title}
          </h4>
        </div>

        {/* Circular countdown indicator */}
        <div className="relative w-8 h-8 flex items-center justify-center font-mono text-xs font-bold text-[var(--spill-key,#FFB04A)]">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="var(--spill-key, #FFB04A)"
              strokeWidth="3"
              strokeDasharray={94.2}
              strokeDashoffset={94.2 * (1 - secondsLeft / 5)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="absolute">{secondsLeft}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => onSelect(nextItem)}
          className="flex-1 py-1.5 px-3 rounded text-xs font-semibold font-mono bg-[var(--spill-key,#FFB04A)] text-[var(--spill-blackwrap,#0E0C0D)] hover:opacity-90 min-h-[44px] transition-opacity"
        >
          Play now
        </button>
        <button
          type="button"
          onClick={() => {
            setCancelled(true);
            onCancel?.();
          }}
          className="py-1.5 px-3 rounded text-xs font-mono text-[var(--spill-diffusion,#F4ECDF)]/70 hover:text-white bg-white/10 hover:bg-white/20 min-h-[44px] transition-colors"
        >
          Cancel (Esc)
        </button>
      </div>
    </div>
  );
}
