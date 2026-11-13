/** @jsxImportSource react */

'use client';

import { useEffect, useState } from 'react';

const SHORTCUT_KEYS = [
  { key: 'Space', label: 'Space' },
  { key: 'K', label: 'K' },
  { key: 'J', label: 'J' },
  { key: 'L', label: 'L' },
  { key: '←', label: '←' },
  { key: '→', label: '→' },
  { key: '↑', label: '↑' },
  { key: '↓', label: '↓' },
  { key: 'M', label: 'M' },
  { key: 'F', label: 'F' },
  { key: 'C', label: 'C' },
  { key: 'N', label: 'N' },
  { key: 'P', label: 'P' },
  { key: 'G', label: 'G' },
  { key: '?', label: '?' },
];

export function KeyStrip() {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let k = e.key;
      if (k === ' ') k = 'Space';
      if (k === 'ArrowLeft') k = '←';
      if (k === 'ArrowRight') k = '→';
      if (k === 'ArrowUp') k = '↑';
      if (k === 'ArrowDown') k = '↓';
      k = k.toUpperCase();

      const match = SHORTCUT_KEYS.find(
        (sk) => sk.key.toUpperCase() === k || sk.label.toUpperCase() === k
      );
      if (match) {
        setActiveKey(match.key);
        const timer = setTimeout(() => setActiveKey(null), 300);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="spill-desktop-key-strip hidden @[900px]/media-root:flex items-center justify-center gap-1.5 py-1.5 pointer-events-none select-none transition-opacity"
    >
      {SHORTCUT_KEYS.map((sk) => {
        const isActive = activeKey === sk.key;
        return (
          <span
            key={sk.key}
            className={`flex items-center justify-center min-w-[22px] h-5 px-1 rounded text-[10px] font-mono font-bold transition-all duration-150 ${
              isActive
                ? 'bg-[var(--spill-key,#FFB04A)] text-black shadow-[0_0_8px_var(--spill-key,#FFB04A)] scale-110'
                : 'bg-[var(--spill-panel,#191517)]/70 text-[var(--spill-diffusion,#F4ECDF)]/60 border border-white/5'
            }`}
          >
            {sk.label}
          </span>
        );
      })}
    </div>
  );
}
