/** @jsxImportSource react */

import { Controls } from '@videojs/react';
import type { ReactNode } from 'react';

import { CaptionsToggle } from './captions-button';
import { ControlsContent, type ControlsSlots } from './controls';
import { VideoBufferingIndicator } from './video-feedback';

export function VideoControlsContent({
  center = false,
  live = false,
  menu,
  renderThumbnail,
  seekBackward,
  seekForward,
  title,
  programmeText,
  onProgrammeClick,
}: ControlsSlots & {
  center?: boolean;
  live?: boolean;
  menu?: ReactNode;
  title?: string;
  programmeText?: string;
  onProgrammeClick?: () => void;
} = {}) {
  return (
    <>
      <Controls.Backdrop
        className={
          'pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.65),transparent_35%,transparent_65%,rgb(0_0_0/0.5))] not-data-visible:hidden forced-colors:bg-none'
        }
      />
      <VideoBufferingIndicator />
      <ControlsContent
        captions={!live && <CaptionsToggle />}
        center={center}
        live={live}
        menu={menu}
        renderThumbnail={renderThumbnail}
        seekBackward={seekBackward}
        seekForward={seekForward}
        programmeText={programmeText}
        onProgrammeClick={onProgrammeClick}
        top={
          <div className="flex w-full min-w-0 items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-md border border-white/10 shadow-sm">
                {title ?? 'Now playing'}
              </span>
              <span className="rounded-full bg-black/65 px-2.5 py-1 font-mono text-xs font-semibold text-white/80 backdrop-blur-md border border-white/10 shadow-sm">
                1080p
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black/65 px-2.5 py-1 font-mono text-xs font-medium text-white/80 backdrop-blur-md border border-white/10 shadow-sm">
                +10s
              </span>
            </div>
          </div>
        }
      />
    </>
  );
}
