/**
 * Replace this public playback ID when the challenge asset is ready.
 *
 * The default is Video.js's public Mux demo asset so a fresh clone remains
 * playable without credentials. Keep the asset public for the final entry.
 */
export const MUX_PLAYBACK_ID = '83EzHOvVzVN01AsrD01BCpiH02Pj3S8mfzBOu101w2nHC5s';

export const muxMedia = {
  src: `https://stream.mux.com/${MUX_PLAYBACK_ID}.m3u8`,
  poster: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=69`,
} as const;
