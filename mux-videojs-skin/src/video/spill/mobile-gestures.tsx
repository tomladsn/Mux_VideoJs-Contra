/** @jsxImportSource react */

'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import type { ProgrammeItem } from './programme';

export interface MobileGesturesProps {
  onPrev?: () => void;
  onNext?: () => void;
  onSeek?: (fraction: number) => void;
  items?: ProgrammeItem[];
}

export function MobileGestures({ onPrev, onNext, onSeek }: MobileGesturesProps) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<'left' | 'right' | null>(null);
  const lastTap = useRef<{ time: number; x: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };

    // Double tap detection
    const now = Date.now();
    if (lastTap.current && now - lastTap.current.time < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = t.clientX - rect.left;
      const isLeft = tapX < rect.width / 2;

      setDoubleTapFeedback(isLeft ? 'left' : 'right');
      setTimeout(() => setDoubleTapFeedback(null), 400);

      // Seek -10 or +10
      const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
      if (video) {
        video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + (isLeft ? -10 : 10)));
        try {
          if (navigator.vibrate) navigator.vibrate(8);
        } catch {}
      }

      lastTap.current = null;
      return;
    }
    lastTap.current = { time: now, x: t.clientX };
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;

    // Vertical swipe for Prev/Next film
    if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.5 && dt < 500) {
      if (dy < 0) {
        // swipe up -> Next
        onNext?.();
      } else {
        // swipe down -> Prev
        onPrev?.();
      }
      try {
        if (navigator.vibrate) navigator.vibrate(12);
      } catch {}
    }

    touchStart.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="absolute inset-0 z-20 touch-pan-y"
    >
      {doubleTapFeedback && (
        <div
          className={`spill-doubletap-ripple ${
            doubleTapFeedback === 'left' ? 'left-1/4 top-1/2 -translate-y-1/2' : 'right-1/4 top-1/2 -translate-y-1/2'
          }`}
        />
      )}
    </div>
  );
}
