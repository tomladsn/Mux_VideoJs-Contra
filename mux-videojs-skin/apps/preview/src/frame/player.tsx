/** @jsxImportSource react */

'use client';

import { useState } from 'react';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { VideoPlayer } from '@videojs/react/video';

import { VideoSkin } from '@/video/skin';
import { muxMedia, programme } from '@/config/mux';
import { Programme, type ProgrammeItem } from '@/video/spill/programme';
import { MobileBottomSheet } from '@/video/spill/mobile-bottom-sheet';
import { MobileCoachMark } from '@/video/spill/mobile-coach-mark';
import { MobileGestures } from '@/video/spill/mobile-gestures';

import type { PlaybackProps } from '../shell/params';

const CHAPTERS = './cosmic-dawn-chapters.vtt';

export function Player({ media }: { media?: PlaybackProps }) {
  const [currentId, setCurrentId] = useState(programme[0].id);
  const [sheetOpen, setSheetOpen] = useState(false);

  const currentIndex = programme.findIndex((p) => p.id === currentId);
  const currentItem = programme[currentIndex] ?? programme[0];
  const src = `https://stream.mux.com/${currentItem.muxPlaybackId}.m3u8`;
  const poster = currentItem.poster ?? `https://image.mux.com/${currentItem.muxPlaybackId}/thumbnail.webp`;

  const handleSelect = (item: ProgrammeItem, startTime = 0) => {
    setCurrentId(item.id);
    if (startTime > 0) {
      setTimeout(() => {
        const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
        if (video) {
          video.currentTime = startTime;
          video.play().catch(() => {});
        }
      }, 100);
    }
  };

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + programme.length) % programme.length;
    handleSelect(programme[nextIdx]);
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % programme.length;
    handleSelect(programme[nextIdx]);
  };

  return (
    <VideoPlayer defaultPlaybackRates={[0.5, 0.75, 1, 1.25, 1.5, 2]} poster={poster}>
      <div className="relative w-full">
        <VideoSkin
          title={currentItem.title}
          programmeText={`Collection ${currentIndex + 1}/${programme.length}`}
        >
          <MuxVideo {...media} src={src} playsInline crossOrigin="">
            <track kind="chapters" label="English" srcLang="en" src={CHAPTERS} default />
          </MuxVideo>
          <MobileGestures onPrev={handlePrev} onNext={handleNext} items={programme} />
        </VideoSkin>

        {/* Mobile bottom controls toggle bar under 700px */}
        <div className="mt-3 flex items-center justify-between px-2 md:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full border border-[var(--spill-key,#FFB04A)]/40 bg-[var(--spill-panel,#191517)] px-4 py-2 font-mono text-xs font-semibold text-[var(--spill-diffusion,#F4ECDF)] shadow-lg backdrop-blur-md active:scale-95"
          >
            <span>📺 Programme</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-[var(--spill-key,#FFB04A)]">
              {currentIndex + 1}/{programme.length}
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous film"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-[var(--spill-panel,#191517)] text-sm text-white active:scale-95"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next film"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-[var(--spill-panel,#191517)] text-sm text-white active:scale-95"
            >
              ⏭
            </button>
          </div>
        </div>

        {/* Desktop / tablet horizontal Programme shelf */}
        <div className="hidden md:block">
          <Programme items={programme} currentId={currentId} onSelect={handleSelect} />
        </div>

        {/* Mobile bottom sheet for Programme collection */}
        <MobileBottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          items={programme}
          currentId={currentId}
          onSelect={handleSelect}
        />

        {/* First visit coach mark for gesture discovery */}
        <MobileCoachMark />
      </div>
    </VideoPlayer>
  );
}
