/** @jsxImportSource react */

'use client';

import { useState } from 'react';

export function LoadingState() {
  return null;
}

export function BufferingState() {
  return null;
}

export interface EndedStateProps {
  onNext?: () => void;
  nextTitle?: string;
  onCancel?: () => void;
}

export function EndedState({ onNext, nextTitle, onCancel }: EndedStateProps) {
  const [countdown, setCountdown] = useState(5);

  if (!onNext) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--spill-key,#FFB04A)]/40 bg-[var(--spill-panel,#191517)] p-6 text-center shadow-2xl">
        <span className="text-xs font-mono font-bold tracking-widest text-[var(--spill-tungsten,#FFB04A)] uppercase">
          Up Next in {countdown}s
        </span>
        <h3 className="text-lg font-semibold text-white">
          {nextTitle || 'Next Feature'}
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-[var(--spill-key,#FFB04A)] px-5 py-2 font-mono text-xs font-bold text-black shadow-lg hover:brightness-110 min-h-[44px] min-w-[44px]"
          >
            Play Now
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 font-mono text-xs text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
          >
            Cancel (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/40 bg-[var(--spill-panel,#191517)] p-6 text-center text-[var(--spill-diffusion,#F4ECDF)]">
        <span className="text-2xl">⚠️</span>
        <h3 className="text-base font-semibold text-white">Couldn't load this video</h3>
        <p className="text-xs opacity-75">Check network connection or source URL</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-full bg-[var(--spill-key,#FFB04A)] px-4 py-2 font-mono text-xs font-bold text-black min-h-[44px] min-w-[44px]"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
