/** @jsxImportSource react */

'use client';

import { useEffect, useRef, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { useQualityOptions } from '@videojs/react';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export interface MobileSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  playbackRate: number;
  onPlaybackRate: (rate: number) => void;
  captionsAvailable: boolean;
  captionsOn: boolean;
  onCaptionsToggle: () => void;
  loop: boolean;
  onLoopToggle: () => void;
  /** Render inside the fullscreen element so the sheet is visible in native fullscreen. */
  portalTarget?: HTMLElement | null;
}

export function MobileSettingsSheet({
  open,
  onClose,
  playbackRate,
  onPlaybackRate,
  captionsAvailable,
  captionsOn,
  onCaptionsToggle,
  loop,
  onLoopToggle,
  portalTarget,
}: MobileSettingsSheetProps) {
  const touchStartY = useRef<number | null>(null);
  // Quality lives in the player store, so this component is rendered inside
  // <VideoPlayer> and portals its markup out to document.body.
  const quality = useQualityOptions();

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
    if (dy > 90) onClose();
    touchStartY.current = null;
  };

  if (!open || typeof document === 'undefined') return null;

  const qualityOptions = quality?.options ?? [];
  const showQuality = !!quality && !quality.hidden && qualityOptions.length > 1;

  return createPortal(
    <div
      className="spill-settings-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Player settings"
      onClick={onClose}
    >
      <div
        className="spill-settings-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="spill-settings-handle" aria-hidden="true" />

        <div className="spill-settings-header">
          <div>
            <span className="spill-settings-eyebrow">PLAYER</span>
            <h3 className="spill-settings-title font-editorial-serif">Settings</h3>
          </div>
          <button
            type="button"
            className="spill-settings-close"
            onClick={onClose}
            aria-label="Close player settings"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {showQuality && quality ? (
          <div className="spill-settings-section">
            <div className="spill-settings-label">
              <span>Quality</span>
              <span className="spill-settings-value">{quality.selectedLabel || 'Auto'}</span>
            </div>
            <div className="spill-settings-pills" role="group" aria-label="Video quality">
              {qualityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`spill-settings-pill${option.value === quality.value ? ' is-active' : ''}`}
                  onClick={() => quality.setValue(option.value)}
                  aria-pressed={option.value === quality.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="spill-settings-section">
          <div className="spill-settings-label">
            <span>Playback speed</span>
            <span className="spill-settings-value">{playbackRate}×</span>
          </div>
          <div className="spill-settings-pills" role="group" aria-label="Playback speed">
            {PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                className={`spill-settings-pill${rate === playbackRate ? ' is-active' : ''}`}
                onClick={() => onPlaybackRate(rate)}
                aria-pressed={rate === playbackRate}
              >
                {rate}×
              </button>
            ))}
          </div>
        </div>

        <div className="spill-settings-section spill-settings-rows">
          <button
            type="button"
            className="spill-settings-row"
            onClick={onCaptionsToggle}
            disabled={!captionsAvailable}
            aria-pressed={captionsOn}
          >
            <span className="spill-settings-row-label">Captions</span>
            <span className="spill-settings-row-value">
              {captionsAvailable ? (captionsOn ? 'On' : 'Off') : 'Unavailable'}
            </span>
          </button>

          <button
            type="button"
            className="spill-settings-row"
            onClick={onLoopToggle}
            aria-pressed={loop}
          >
            <span className="spill-settings-row-label">Loop film</span>
            <span className="spill-settings-row-value">{loop ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>
    </div>,
    portalTarget ?? document.body
  );
}
