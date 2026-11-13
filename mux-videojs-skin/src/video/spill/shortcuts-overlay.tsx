/** @jsxImportSource react */

'use client';

import { useEffect, useRef } from 'react';

export interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  category: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'PLAYBACK',
    items: [
      { keys: ['Space', 'K'], description: 'Play · Pause' },
      { keys: ['J'], description: 'Seek −10s' },
      { keys: ['L'], description: 'Seek +10s' },
      { keys: ['←', '→'], description: 'Seek −5s / +5s' },
    ],
  },
  {
    category: 'VOLUME',
    items: [
      { keys: ['↑', '↓'], description: 'Volume Up / Down' },
      { keys: ['M'], description: 'Mute / Unmute' },
    ],
  },
  {
    category: 'NAVIGATION',
    items: [
      { keys: ['N'], description: 'Next track' },
      { keys: ['P'], description: 'Previous track' },
      { keys: ['1–9'], description: 'Jump to programme item' },
    ],
  },
  {
    category: 'OTHER',
    items: [
      { keys: ['F'], description: 'Toggle Fullscreen' },
      { keys: ['C'], description: 'Toggle Captions' },
      { keys: ['G'], description: 'Toggle Ambient Glow' },
      { keys: ['?'], description: 'Show Shortcuts' },
    ],
  },
];

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Focus trap & Escape key
  useEffect(() => {
    if (!open) return;

    // Focus close button on open
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full h-full md:h-auto md:max-h-[85vh] md:max-w-lg rounded-none md:rounded-2xl bg-[#0F0C16] text-[#F3EDF8] border-0 md:border md:border-[#FF5C8A]/30 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(255,92,138,0.2)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161120]/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest text-[#FF5C8A] uppercase drop-shadow-[0_0_8px_rgba(255,92,138,0.5)]">
              SPILL
            </span>
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts dialog"
            className="flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 min-w-[44px] min-h-[44px] transition-colors focus-visible:outline-2 focus-visible:outline-[#FF5C8A]"
          >
            <span className="text-lg">✕</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-[#0F0C16]" style={{ scrollbarWidth: 'thin' }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="text-[11px] font-mono font-bold tracking-wider text-[#FF5C8A] uppercase">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <span className="text-xs text-white/90 truncate mr-2">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-2 py-0.5 min-w-[24px] text-center text-[11px] font-mono font-bold rounded bg-[#181322] text-[#FFA6C2] border border-[#FF5C8A]/35 shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#161120]/80 text-center">
          <span className="text-[11px] font-mono text-white/70">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#181322] text-[#FF5C8A] border border-[#FF5C8A]/40 font-bold font-mono">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#181322] text-[#FF5C8A] border border-[#FF5C8A]/40 font-bold font-mono">?</kbd> to dismiss
          </span>
        </div>
      </div>
    </div>
  );
}
