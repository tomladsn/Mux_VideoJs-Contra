import { MuxVideo } from '@videojs/react/media/mux-video';
import { VideoPlayer } from '@videojs/react/video';

import { VideoSkin } from '@/video/skin';
import { muxMedia } from '@/config/mux';

import type { PlaybackProps } from '../shell/params';

// The Mux source lives in src/config/mux.ts so the final Playback ID has one
// obvious, skin-owned configuration point.
/** Chapters for the time slider, served from `apps/preview/public`. */
const CHAPTERS = './cosmic-dawn-chapters.vtt';

/** `media` carries the workbench's playback options: autoplay, muted, loop, and preload. */
export function Player({ media }: { media?: PlaybackProps }) {
  return (
    <VideoPlayer poster={muxMedia.poster}>
      <VideoSkin>
        <MuxVideo {...media} src={muxMedia.src} playsInline crossOrigin="">
          <track kind="chapters" label="English" srcLang="en" src={CHAPTERS} default />
        </MuxVideo>
      </VideoSkin>
    </VideoPlayer>
  );
}
