/** @jsxImportSource react */

import { Time, Controls, BufferingIndicator, Tooltip } from '@videojs/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/resolve-class-name';

import { LiveButton } from './live-button';
import { AudioPlayButton, PlayButton } from './play-button';
import { PlaybackRateButton } from './playback-rate-button';
import { TimeSlider } from './time-slider';
import { type ThumbnailSlot } from './time-slider';
import { VolumePopover } from './volume-popover';
import { FullscreenButton } from './screen-controls';
import { ColourReel } from '../spill/colour-reel';
import { muxConfig } from '@/config/mux';

export function ControlsRow({
  audio = false,
  captions,
  live = false,
  menu,
  rate,
  seekBackward,
  seekForward,
  programmeText = 'Collection',
  onProgrammeClick,
  onPrev,
  onNext,
}: ControlsSlots & {
  audio?: boolean;
  live?: boolean;
  menu?: ReactNode;
  programmeText?: string;
  onProgrammeClick?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
} = {}) {
  return (
    <Controls.Group className="flex items-center justify-between gap-2 rtl:flex-row-reverse w-full">
      {/* Left cluster: Prev, Big Pink Play/Pause, Next, Time */}
      <Controls.Group className="flex min-w-0 items-center gap-1.5 rtl:flex-row-reverse sm:gap-2.5">
        {/* Previous button */}
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous track"
          className="size-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 flex items-center justify-center transition-all duration-150 backdrop-blur-md"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5v14h2.5V5H6zm3.5 7 10.5 7V5l-10.5 7z" />
          </svg>
        </button>

        {/* Big Pink Play/Pause Button */}
        {audio ? (
          <AudioPlayButton />
        ) : (
          <PlayButton
            className="size-11! rounded-full! bg-[#FF4D85]! text-black! shadow-[0_0_20px_rgba(255,77,133,0.5)]! hover:bg-[#FF3875]! hover:scale-105! active:scale-95! transition-all! duration-150!"
            iconClassName="size-5! text-black!"
            tooltip={false}
          />
        )}

        {/* Next button */}
        <button
          type="button"
          onClick={onNext}
          aria-label="Next track"
          className="size-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/90 flex items-center justify-center transition-all duration-150 backdrop-blur-md"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="m4 19 10.5-7L4 5v14zm11.5-14v14H18V5h-2.5z" />
          </svg>
        </button>

        {seekBackward}
        {seekForward}
        {live && <LiveButton />}

        {/* Time display: 0:54 / 1:51 */}
        {!live && (
          <Time.Group className="flex h-6 shrink-0 items-center gap-1 px-2 font-sans text-xs font-medium leading-none tabular-nums text-white/90 rtl:flex-row-reverse">
            <Time.Value className="text-white font-medium" type="current" />
            <span className="text-white/40">/</span>
            <Time.Value className="text-white/70" type="duration" />
          </Time.Group>
        )}
      </Controls.Group>

      {/* Right cluster: Programme badge, Volume, CC, 1x, Fullscreen */}
      <Controls.Group className="flex items-center gap-1.5 rtl:flex-row-reverse sm:gap-2">
        {programmeText && (
          <button
            type="button"
            onClick={onProgrammeClick}
            className="h-8 px-3 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-medium text-white/90 flex items-center gap-1.5 backdrop-blur-md transition-all duration-150"
          >
            <span>{programmeText}</span>
          </button>
        )}
        {!audio && <VolumePopover />}
        {captions}
        {!audio && !live && <PlaybackRateButton />}
        {rate}
        {menu}
        {!audio && <FullscreenButton />}
      </Controls.Group>
    </Controls.Group>
  );
}

export interface ControlsSlots extends ThumbnailSlot {
  /** The captions toggle, supplied by the video presets because the audio presets have no text track feature. */
  captions?: ReactNode;
  /** The playback-rate control, supplied by the on-demand audio preset. */
  rate?: ReactNode;
  /** The skip-back control, supplied by the presets that have a timeline. */
  seekBackward?: ReactNode;
  /** The skip-forward control, supplied by the presets that have a timeline. */
  seekForward?: ReactNode;
}

export function ControlsContent({
  audio = false,
  captions,
  center = false,
  live = false,
  menu,
  rate,
  renderThumbnail,
  seekBackward,
  seekForward,
  top,
  useReel = true,
  programmeText,
  onProgrammeClick,
}: ControlsSlots & {
  audio?: boolean;
  center?: boolean;
  live?: boolean;
  menu?: ReactNode;
  top?: ReactNode;
  useReel?: boolean;
  programmeText?: string;
  onProgrammeClick?: () => void;
} = {}) {
  const muxPlaybackId = muxConfig?.playbackId;
  return (
    <Controls.Content
      className={cn('group/controls pointer-events-none absolute inset-0 z-30', audio && 'relative! inset-auto!')}
    >
      <Tooltip.Provider>
        {/* ── Top bar: title + screen controls ── */}
        {top && (
          <Controls.Group
            className={cn(
              'pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center gap-2 p-3 rtl:flex-row-reverse media-sm:p-4',
              'transition-all duration-200 group-not-data-visible/controls:pointer-events-none group-not-data-visible/controls:opacity-0 group-not-data-visible/controls:-translate-y-1',
              // Top gradient scrim so icons are readable over bright video
              'bg-[linear-gradient(to_bottom,rgb(0_0_0/0.55)_0%,transparent_100%)]',
              'media-high-contrast:bg-media-background forced-colors:bg-[Canvas]'
            )}
          >
            {top}
          </Controls.Group>
        )}

        {/* ── Center HUD: seek-back | big play | seek-forward ── */}
        {center && (
          <BufferingIndicator className="group/center-buffering contents">
            <Controls.Group
              className={cn(
                'pointer-events-auto absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 rtl:flex-row-reverse media-360:flex',
                'transition-all duration-200 group-not-data-visible/controls:pointer-events-none group-not-data-visible/controls:scale-90 group-not-data-visible/controls:opacity-0',
                'group-data-visible/center-buffering:hidden!',
                'media-high-contrast:bg-media-background media-high-contrast:px-3 media-high-contrast:rounded-xl forced-colors:bg-transparent!'
              )}
            >
              {seekBackward}
              <PlayButton
                className={cn(
                  // Big white circle play button for center HUD
                  'size-16! rounded-full! bg-white! text-black! shadow-[0_4px_32px_rgba(0,0,0,0.6)]!',
                  'hover:scale-110! active:scale-95! transition-transform! duration-150!'
                )}
                iconClassName="size-8! text-black!"
                tooltip={false}
              />
              {seekForward}
            </Controls.Group>
          </BufferingIndicator>
        )}

        {/* ── Bottom floating dock ── */}
        <div
          className={cn(
            // Floating glass pill, inset from edges
            'pointer-events-auto absolute inset-x-3 bottom-3 flex flex-col gap-2 media-sm:inset-x-4 media-sm:bottom-4',
            'rounded-2xl border border-white/10 bg-neutral-950/85 p-3 shadow-2xl backdrop-blur-xl media-sm:p-3.5',
            'transition-all duration-200 group-not-data-visible/controls:pointer-events-none group-not-data-visible/controls:translate-y-2 group-not-data-visible/controls:opacity-0',
            'media-high-contrast:rounded-none media-high-contrast:border-0 media-high-contrast:bg-media-background forced-colors:rounded-none! forced-colors:border-0! forced-colors:bg-[Canvas]!',
            audio && 'static! rounded-xl!',
            !audio && 'forced-colors:inset-x-0! forced-colors:bottom-0!'
          )}
        >
          {!live && (useReel ? <ColourReel playbackId={muxPlaybackId} renderThumbnail={renderThumbnail} audio={audio} /> : <TimeSlider audio={audio} renderThumbnail={renderThumbnail} />)}
          <ControlsRow
            audio={audio}
            captions={captions}
            live={live}
            menu={menu}
            rate={rate}
            seekBackward={center ? undefined : seekBackward}
            seekForward={center ? undefined : seekForward}
            programmeText={programmeText}
            onProgrammeClick={onProgrammeClick}
          />
        </div>
      </Tooltip.Provider>
    </Controls.Content>
  );
}
