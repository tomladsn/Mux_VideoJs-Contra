/** @jsxImportSource react */

import { Controls } from '@videojs/react';

import { cn } from '@/lib/resolve-class-name';

import { SeekButton } from './shared/seek-button';
import { SettingsMenu } from './shared/settings-menu';
import type { ThumbnailSlot } from './shared/time-slider';
import { VideoControlsContent } from './shared/video-controls';

export function VideoControls({
  renderThumbnail,
  title,
  programmeText,
  onProgrammeClick,
}: ThumbnailSlot & {
  title?: string;
  programmeText?: string;
  onProgrammeClick?: () => void;
} = {}) {
  return (
    <Controls.Root>
      <VideoControlsContent
        center
        menu={<SettingsMenu />}
        renderThumbnail={renderThumbnail}
        title={title}
        programmeText={programmeText}
        onProgrammeClick={onProgrammeClick}
        seekBackward={
          <SeekButton
            className={cn(
              'm-0! rounded-full! border! border-white/15! bg-white/10! text-white! backdrop-blur-md!',
              'hover:bg-white/25! hover:scale-105! active:scale-95! focus-visible:bg-white/25!',
              'size-11! transition-all! duration-150!'
            )}
            iconClassName="size-5"
            seconds={-10}
            tooltip={false}
          />
        }
        seekForward={
          <SeekButton
            className={cn(
              'm-0! rounded-full! border! border-white/15! bg-white/10! text-white! backdrop-blur-md!',
              'hover:bg-white/25! hover:scale-105! active:scale-95! focus-visible:bg-white/25!',
              'size-11! transition-all! duration-150!'
            )}
            iconClassName="size-5"
            seconds={10}
            tooltip={false}
          />
        }
      />
    </Controls.Root>
  );
}
