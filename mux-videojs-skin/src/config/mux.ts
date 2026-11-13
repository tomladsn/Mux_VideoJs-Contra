import type { ProgrammeItem } from '../video/spill/programme';
export type { ProgrammeItem };

/**
 * Mux video playback configuration.
 * Provided challenge asset: Blender 3D / Neon Hours.
 */
export const MUX_PLAYBACK_ID = 'B74fze6bd74yCEr7YfHHWf3MHg8mAfCoOMLodDgTtuQ';

/** Second collection film: Girl and the Glowing Staff. */
export const GIRL_GLOWING_STAFF_PLAYBACK_ID =
  'wNmCH701bbQBi00foywPTGb4dBA6v025v6aFmEzpvW001ic';

export const muxConfig = {
  playbackId: MUX_PLAYBACK_ID,
  title: 'Blender 3D',
  metadataTitle: 'Blender 3d',
  thumbnailTime: 35.95,
  duration: 111, // 1:51
};

export const muxMedia = {
  src: `https://stream.mux.com/${MUX_PLAYBACK_ID}.m3u8`,
  poster: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=35.95`,
} as const;

export const programme: ProgrammeItem[] = [
  {
    id: '1',
    title: 'Blender 3D',
    muxPlaybackId: MUX_PLAYBACK_ID,
    duration: 111,
    poster: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=35.95`,
    dominantColour: 'oklch(0.65 0.22 320)',
  },
  {
    id: '2',
    title: 'Azure Horizon',
    muxPlaybackId: MUX_PLAYBACK_ID,
    duration: 111,
    poster: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=15`,
    dominantColour: 'oklch(0.65 0.16 220)',
  },
  {
    id: '3',
    title: 'Solar Flare',
    muxPlaybackId: MUX_PLAYBACK_ID,
    duration: 111,
    poster: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=25`,
    dominantColour: 'oklch(0.70 0.18 45)',
  },
  {
    id: '6',
    title: 'Girl and the Glowing Staff',
    muxPlaybackId: GIRL_GLOWING_STAFF_PLAYBACK_ID,
    duration: 464, // 7:44
    poster: `https://image.mux.com/${GIRL_GLOWING_STAFF_PLAYBACK_ID}/thumbnail.webp?time=10`,
    dominantColour: 'oklch(0.72 0.19 65)',
  },
  {
    id: '4',
    title: 'Emerald Forest',
    muxPlaybackId: MUX_PLAYBACK_ID,
    duration: 111,
    poster: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=50`,
    dominantColour: 'oklch(0.65 0.16 150)',
  },
  {
    id: '5',
    title: 'Velvet Dusk',
    muxPlaybackId: MUX_PLAYBACK_ID,
    duration: 111,
    poster: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=75`,
    dominantColour: 'oklch(0.55 0.18 280)',
  },
];
