/** @jsxImportSource react */

'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'spill-hint-seen';

export interface FirstVisitChipProps {
  onDismiss?: () => void;
  onClick?: () => void;
}

export function FirstVisitChip({ onDismiss, onClick }: FirstVisitChipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // ignore
    }

    const timer = setTimeout(() => {
      dismiss();
    }, 6000);

    const onKey = () => {
      dismiss();
    };
    window.addEventListener('keydown', onKey, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-auto absolute bottom-20 left-4 z-40 flex items-center gap-2 rounded-full border border-[var(--spill-key,#FFB04A)]/30 bg-[var(--spill-panel,#191517)]/90 px-3 py-1.5 font-mono text-xs text-[var(--spill-diffusion,#F4ECDF)] shadow-xl backdrop-blur-md transition-opacity duration-300">
      <button
        type="button"
        onClick={() => {
          onClick?.();
          dismiss();
        }}
        className="flex items-center gap-1.5 hover:text-[var(--spill-key,#FFB04A)]"
      >
        <span>Press</span>
        <kbd className="rounded bg-black/50 px-1.5 py-0.5 font-bold text-[var(--spill-key,#FFB04A)] border border-white/10">?</kbd>
        <span>for shortcuts</span>
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss shortcut tip"
        className="ml-1 text-white/50 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
