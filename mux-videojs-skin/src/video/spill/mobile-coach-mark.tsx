/** @jsxImportSource react */

'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'spill-coach-seen';

export function MobileCoachMark() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Gesture instructions"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-w-xs flex-col items-center gap-5 rounded-3xl border border-[var(--spill-key,#FFB04A)]/40 bg-[var(--spill-panel,#191517)] p-6 text-center text-[var(--spill-diffusion,#F4ECDF)] shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--spill-tungsten,#FFB04A)]">
            One-Thumb Gestures
          </span>
        </div>

        <div className="space-y-4 text-left text-xs font-medium">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-base">
              ↔
            </span>
            <span>
              <strong className="text-white">Swipe horizontal:</strong> Scrub timeline & room glow
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-base">
              ↕
            </span>
            <span>
              <strong className="text-white">Swipe vertical:</strong> Previous or next film
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-base">
              ⇥
            </span>
            <span>
              <strong className="text-white">Double-tap edges:</strong> Skip 10 seconds back / ahead
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-2 min-h-[44px] min-w-[44px] w-full rounded-full bg-[var(--spill-key,#FFB04A)] px-6 py-2.5 font-mono text-xs font-bold text-black shadow-lg hover:brightness-110 active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
