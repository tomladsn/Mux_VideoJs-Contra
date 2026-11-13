/** @jsxImportSource react */

'use client';

import { useEffect } from 'react';
import { Hotkey } from '@videojs/react';

import { PlaybackHotkeys } from './playback-hotkeys';
import { useFeedback } from '../spill/on-screen-feedback';

export interface VideoHotkeysProps {
  disabled?: boolean | undefined;
  onOpenShortcuts?: () => void;
}

export function VideoHotkeys({ disabled = false, onOpenShortcuts }: VideoHotkeysProps = {}) {
  const triggerFeedback = useFeedback();

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when in input / contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        onOpenShortcuts?.();
      } else if (e.key === 'g' || e.key === 'G') {
        triggerFeedback({ icon: '💡', label: 'Toggled Ambient Glow' });
      } else if (e.key === 'k' || e.key === 'K' || e.key === ' ') {
        triggerFeedback({ icon: '⏯', label: 'Play / Pause' });
      } else if (e.key === 'j' || e.key === 'J') {
        triggerFeedback({ icon: '⏪', label: '−10s' });
      } else if (e.key === 'l' || e.key === 'L') {
        triggerFeedback({ icon: '⏩', label: '+10s' });
      } else if (e.key === 'm' || e.key === 'M') {
        triggerFeedback({ icon: '🔇', label: 'Mute / Unmute' });
      } else if (e.key === 'f' || e.key === 'F') {
        triggerFeedback({ icon: '⛶', label: 'Fullscreen' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onOpenShortcuts, triggerFeedback]);

  return (
    <>
      <PlaybackHotkeys disabled={disabled} />
      <Hotkey disabled={disabled} keys="f" action="toggleFullscreen" />
      <Hotkey disabled={disabled} keys="c" action="toggleSubtitles" />
      <Hotkey disabled={disabled} keys="i" action="togglePictureInPicture" />
    </>
  );
}
