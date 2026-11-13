/** @jsxImportSource react */

'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import type { ProgrammeItem } from './programme';

export interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  items: ProgrammeItem[];
  currentId: string;
  onSelect: (item: ProgrammeItem) => void;
}

export function MobileBottomSheet({
  open,
  onClose,
  items,
  currentId,
  onSelect,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) {
      onClose();
    }
    touchStartY.current = null;
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Programme Collection"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex max-h-[80vh] flex-col rounded-t-3xl border-t border-[#FF5C8A]/30 bg-[#0F0C16] p-4 text-white shadow-2xl transition-transform"
      >
        {/* Drag handle */}
        <div className="flex w-full items-center justify-center py-2">
          <div className="h-1.5 w-12 rounded-full bg-white/30" />
        </div>

        <div className="mb-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF5C8A]">
              Programme
            </span>
            <span className="text-xs text-white/50">({items.length} titles)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close programme sheet"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Card list */}
        <div className="flex-1 space-y-2.5 overflow-y-auto px-1 pb-6" style={{ scrollbarWidth: 'thin' }}>
          {items.map((item, idx) => {
            const isCurrent = item.id === currentId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                aria-current={isCurrent ? 'true' : undefined}
                className={`flex w-full min-h-[56px] items-center gap-3.5 rounded-2xl border p-2.5 text-left transition-all ${
                  isCurrent
                    ? 'border-[#FF5C8A] bg-white/10 shadow-[0_0_12px_rgba(255,92,138,0.25)]'
                    : 'border-white/5 bg-black/30 hover:border-white/20'
                }`}
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-black">
                  {item.poster && (
                    <img src={item.poster} alt="" className="size-full object-cover" />
                  )}
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 font-mono text-[9px] text-white">
                    0{idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.dominantColour || 'var(--spill-key)' }}
                    />
                    <h4 className="truncate font-semibold text-sm text-white">{item.title}</h4>
                  </div>
                  <span className="font-mono text-xs text-white/60">
                    {Math.floor(item.duration / 60)}:
                    {(item.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
