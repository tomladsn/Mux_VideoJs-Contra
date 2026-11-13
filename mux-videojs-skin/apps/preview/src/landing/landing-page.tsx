/** @jsxImportSource react */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { VideoPlayer } from '@videojs/react/video';

import { VideoSkin } from '@/video/skin';
import { ShortcutsOverlay } from '@/video/spill/shortcuts-overlay';
import { setGlowMode } from '@/video/ambient-glow';
import { MUX_PLAYBACK_ID, GIRL_GLOWING_STAFF_PLAYBACK_ID } from '@/config/mux';
import { MobileSettingsSheet } from './mobile-settings-sheet';
import { CollectionPanel } from './collection-panel';

interface FilmItem {
  id: string;
  title: string;
  duration: number;
  gradient: string;
  ambientGlow: string;
  playbackId?: string;
  poster?: string;
  /** True for films added at runtime from a Mux playback ID. */
  custom?: boolean;
}

// The programme starts with the two films uploaded to Mux. Each entry carries
// its own playback ID, so Next/Prev loads a genuinely different asset.
const DEFAULT_FILMS: FilmItem[] = [
  {
    id: '1',
    title: 'Blender 3d',
    duration: 391, // 6:31
    gradient: 'linear-gradient(135deg, #7c3aed, #ec4899, #f59e0b)',
    ambientGlow: 'rgba(255, 92, 138, 0.25)',
    playbackId: MUX_PLAYBACK_ID,
    poster: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=35.95`,
  },
  {
    id: '2',
    title: 'Girl and the Glowing Staff',
    duration: 464, // 7:44
    gradient: 'linear-gradient(135deg, #f59e0b, #ec4899, #7c3aed)',
    ambientGlow: 'rgba(245, 158, 11, 0.25)',
    playbackId: GIRL_GLOWING_STAFF_PLAYBACK_ID,
    poster: `https://image.mux.com/${GIRL_GLOWING_STAFF_PLAYBACK_ID}/thumbnail.webp?time=10`,
  },
];

// Films added by playback ID survive reloads in this browser.
const CUSTOM_FILMS_KEY = 'spill.customFilms.v1';
// The film the visitor played last, so the hero poster matches it on the next visit.
const LAST_FILM_KEY = 'spill.lastFilmId.v1';

const CUSTOM_GRADIENTS = [
  'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  'linear-gradient(135deg, #f97316, #fbbf24)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #6366f1, #a855f7)',
  'linear-gradient(135deg, #ef4444, #f59e0b)',
  'linear-gradient(135deg, #14b8a6, #6366f1)',
];

const CUSTOM_GLOWS = [
  'rgba(14, 165, 233, 0.22)',
  'rgba(249, 115, 22, 0.22)',
  'rgba(5, 150, 105, 0.22)',
  'rgba(99, 102, 241, 0.22)',
  'rgba(239, 68, 68, 0.22)',
  'rgba(20, 184, 166, 0.22)',
];

/** Reads playback IDs (or player/stream URLs) from free text. */
function parsePlaybackId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Accept a full Mux URL as well as a bare playback ID.
  const urlMatch = value.match(/(?:player|stream|image)\.mux\.com\/([A-Za-z0-9_-]+)/);
  const candidate = urlMatch ? urlMatch[1] : value;

  return /^[A-Za-z0-9_-]{8,128}$/.test(candidate) ? candidate : null;
}

function loadCustomFilms(): FilmItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_FILMS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is { playbackId: string; title?: string; duration?: number } =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as { playbackId?: unknown }).playbackId === 'string'
      )
      .map((item, index) => ({
        id: `custom-${item.playbackId}`,
        title: item.title?.trim() || `Mux film ${index + 1}`,
        duration: typeof item.duration === 'number' && item.duration > 0 ? item.duration : 0,
        gradient: CUSTOM_GRADIENTS[index % CUSTOM_GRADIENTS.length],
        ambientGlow: CUSTOM_GLOWS[index % CUSTOM_GLOWS.length],
        playbackId: item.playbackId,
        poster: `https://image.mux.com/${item.playbackId}/thumbnail.webp?time=5`,
        custom: true,
      }));
  } catch {
    return [];
  }
}

/** The id (or playback id) of the film played last, if we remember one. */
function loadLastFilmId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(LAST_FILM_KEY);
  } catch {
    return null;
  }
}

// Colour reel palette — 10 chunky segments matching design mockups exactly
const COLOUR_REEL_PALETTE = [
  '#421B59',
  '#6C247A',
  '#FF4B84',
  '#FFA173',
  '#FFDFCC',
  '#1B4452',
  '#133644',
  '#2B687B',
  '#1C1A2B',
  '#622143',
];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type Phase = 'idle' | 'dissolving' | 'cinema';

export function LandingPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const cinemaMode = phase === 'cinema';
  const isDissolving = phase === 'dissolving';
  const showPlayer = phase !== 'idle';

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [filmIndex, setFilmIndex] = useState(() => {
    // Restore the hero poster to the film that was played last.
    const lastId = loadLastFilmId();
    if (!lastId) return 0;
    const savedFilms = [...DEFAULT_FILMS, ...loadCustomFilms()];
    const index = savedFilms.findIndex(
      (film) => film.id === lastId || film.playbackId === lastId
    );
    return index >= 0 ? index : 0;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [designNotesOpen, setDesignNotesOpen] = useState(false);
  const [videoAR, setVideoAR] = useState<'landscape' | 'portrait'>('landscape');
  const [mobileUiVisible, setMobileUiVisible] = useState(true);
  const [mobileUiHeld, setMobileUiHeld] = useState(false);
  const [mobileUiNonce, setMobileUiNonce] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const [muted, setMuted] = useState(false);
  const [captionsAvailable, setCaptionsAvailable] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [mediaDuration, setMediaDuration] = useState(0);
  // Films the visitor adds by Mux playback ID, persisted for this browser.
  const [customFilms, setCustomFilms] = useState<FilmItem[]>(() => loadCustomFilms());

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dissolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);

  const films: FilmItem[] = [...DEFAULT_FILMS, ...customFilms];
  const currentFilm = films[filmIndex] ?? films[0];
  const currentPlaybackId = currentFilm.playbackId ?? MUX_PLAYBACK_ID;
  const videoSrc = `https://stream.mux.com/${currentPlaybackId}.m3u8`;
  const posterUrl =
    currentFilm.poster ??
    `https://image.mux.com/${currentPlaybackId}/thumbnail.webp?time=35.95`;
  // Prefer the real duration reported by the loaded film; the per-film value is
  // only the known/estimated duration until metadata arrives.
  const filmDuration = mediaDuration > 0 ? mediaDuration : currentFilm.duration;

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Visitor-added films persist in this browser ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = customFilms.map((film) => ({
      playbackId: film.playbackId,
      title: film.title,
      duration: film.duration,
    }));
    try {
      window.localStorage.setItem(CUSTOM_FILMS_KEY, JSON.stringify(payload));
    } catch {
      // Private mode / storage full: the collection still works for this session.
    }
  }, [customFilms]);

  // Once a custom film reports its real duration, remember it for the collection.
  useEffect(() => {
    if (!currentFilm.custom || mediaDuration <= 0) return;
    setCustomFilms((prev) =>
      prev.map((film) =>
        film.id === currentFilm.id && Math.abs(film.duration - mediaDuration) > 0.5
          ? { ...film, duration: mediaDuration }
          : film
      )
    );
  }, [currentFilm.custom, currentFilm.id, mediaDuration]);

  // ── The hero remembers the film that was played last ──
  // Going back to the landing page (or reloading it) keeps that film in the hero
  // preview card, so the poster matches the thumbnail of the video just watched.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LAST_FILM_KEY, currentFilm.id);
    } catch {
      // Private mode: the hero still follows the current film for this session.
    }
  }, [currentFilm.id]);

  // ── Mobile cinema always spills colour ──
  // The mobile sheet no longer exposes an ambient control, so force the engine to
  // full whenever we enter mobile cinema (a persisted "off"/"soft" would otherwise
  // leave the room black).
  useEffect(() => {
    if (!cinemaMode || !isMobile) return;
    setGlowMode('full');
  }, [cinemaMode, isMobile, filmIndex]);

  // ── Switching films loads the next Mux asset ──
  // The cinema player is keyed by film, so it remounts on every next/prev.
  // Reset the transport so the new film starts cleanly.
  useEffect(() => {
    setCurrentTime(0);
    setMediaDuration(0);
    setIsPlaying(false);
  }, [filmIndex]);

  // A remounted player starts paused; resume the newly selected film.
  useEffect(() => {
    if (!cinemaMode) return;
    let cancelled = false;

    const tryPlay = () => {
      if (cancelled) return;
      const video =
        (document.querySelector('.spill-mobile-video-container video') as HTMLVideoElement | null) ??
        (document.querySelector('.media-skin video') as HTMLVideoElement | null);
      if (!video) return;
      if (!video.paused && video.currentTime > 0) return;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    };

    const timers = [120, 400, 900, 1600].map((ms) => setTimeout(tryPlay, ms));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [cinemaMode, filmIndex]);

  // ── Mobile cinema chrome auto-hide ──
  // While the film plays, the title / timestamp / seek reel / controls fade away after a
  // few seconds so the video sits alone in the dark room. Any interaction brings them back.
  const revealMobileUi = useCallback(() => {
    setMobileUiVisible(true);
    setMobileUiNonce((n) => n + 1);
  }, []);

  const beginMobileUiInteraction = useCallback(() => {
    setMobileUiHeld(true);
    revealMobileUi();
  }, [revealMobileUi]);

  // A scrub or a long press keeps the chrome up until the pointer is released.
  useEffect(() => {
    if (!mobileUiHeld) return;
    const release = () => setMobileUiHeld(false);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [mobileUiHeld]);

  useEffect(() => {
    if (phase === 'cinema') setMobileUiVisible(true);
  }, [phase]);

  useEffect(() => {
    if (cinemaMode) setMobileUiVisible(true);
  }, [cinemaMode, filmIndex]);

  useEffect(() => {
    // Pausing (or reaching the end) always brings the controls back.
    if (cinemaMode && isMobile && !isPlaying) setMobileUiVisible(true);
  }, [cinemaMode, isMobile, isPlaying]);

  useEffect(() => {
    if (!cinemaMode || !isMobile) {
      setMobileUiVisible(true);
      return;
    }
    // Keep the chrome up while paused, touching the screen, or in a panel.
    if (!isPlaying || !mobileUiVisible || mobileUiHeld || settingsOpen || collectionOpen) return;

    const timer = setTimeout(() => setMobileUiVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [cinemaMode, isMobile, isPlaying, mobileUiVisible, mobileUiHeld, mobileUiNonce, filmIndex, settingsOpen, collectionOpen]);

  // ── Custom SPILL glowing cursor ──
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  // Hook into video element: track time, play/pause, AR detection, and buffer readiness
  useEffect(() => {
    if (!showPlayer) return;

    const tryBind = () => {
      const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
      if (!video) return false;
      videoRef.current = video;

      const onTimeUpdate = () => {
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          setMediaDuration(video.duration);
        }
        setCurrentTime(video.currentTime);
      };
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onMeta = () => {
        if (video.videoWidth && video.videoHeight) {
          setVideoAR(video.videoWidth >= video.videoHeight ? 'landscape' : 'portrait');
        }
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          setMediaDuration(video.duration);
        }
      };

      // When video is sufficiently loaded to play, complete dissolve into cinema!
      const onReadyToPlay = () => {
        if (phase === 'dissolving') {
          if (dissolveTimerRef.current) clearTimeout(dissolveTimerRef.current);
          setPhase('cinema');
          video.play().catch(() => {});
          setIsPlaying(true);
        }
      };

      video.addEventListener('timeupdate', onTimeUpdate);
      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      video.addEventListener('loadedmetadata', onMeta);
      video.addEventListener('canplay', onReadyToPlay);
      video.addEventListener('playing', onReadyToPlay);

      // Metadata may already be available by the time we bind (for example when
      // returning from cinema), so capture it now instead of waiting for events.
      onMeta();
      onTimeUpdate();

      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate);
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('loadedmetadata', onMeta);
        video.removeEventListener('canplay', onReadyToPlay);
        video.removeEventListener('playing', onReadyToPlay);
      };
    };

    const cleanup = setTimeout(() => {
      tryBind();
    }, 80);

    return () => clearTimeout(cleanup);
  }, [showPlayer, phase, filmIndex]);

  // ── Mobile player settings: speed, loop, mute and captions ──
  useEffect(() => {
    if (!cinemaMode || !isMobile) return;

    const getVideo = () =>
      (document.querySelector('.spill-mobile-video-container video') as HTMLVideoElement | null) ??
      (document.querySelector('.media-skin video') as HTMLVideoElement | null);

    const apply = () => {
      const video = getVideo();
      if (!video) return;
      video.playbackRate = playbackRate;
      video.loop = loop;
      video.muted = muted;
      const tracks = video.textTracks;
      for (let i = 0; i < tracks.length; i += 1) {
        tracks[i].mode = captionsOn ? 'showing' : 'hidden';
      }
    };

    apply();
    const early = setTimeout(apply, 150);
    const late = setTimeout(apply, 900);
    const video = getVideo();
    const trackList = video?.textTracks;
    video?.addEventListener('loadedmetadata', apply);
    trackList?.addEventListener('addtrack', apply);

    return () => {
      clearTimeout(early);
      clearTimeout(late);
      video?.removeEventListener('loadedmetadata', apply);
      trackList?.removeEventListener('addtrack', apply);
    };
  }, [cinemaMode, isMobile, playbackRate, loop, muted, captionsOn, filmIndex]);

  // Detect whether this film actually ships subtitle/caption tracks.
  useEffect(() => {
    if (!cinemaMode || !isMobile) return;

    const check = () => {
      const video =
        (document.querySelector('.spill-mobile-video-container video') as HTMLVideoElement | null) ??
        (document.querySelector('.media-skin video') as HTMLVideoElement | null);
      if (!video) return;
      const tracks = Array.from(video.textTracks);
      const available = tracks.some((track) => track.kind === 'captions' || track.kind === 'subtitles');
      setCaptionsAvailable(available);
      if (!available) setCaptionsOn(false);
    };

    check();
    const timers = [400, 1200, 3000].map((ms) => setTimeout(check, ms));
    return () => timers.forEach(clearTimeout);
  }, [cinemaMode, isMobile, filmIndex]);

  // Settings always keep the chrome up.
  useEffect(() => {
    if (settingsOpen) setMobileUiVisible(true);
  }, [settingsOpen]);

  // So does the collection browser.
  useEffect(() => {
    if (collectionOpen) setMobileUiVisible(true);
  }, [collectionOpen]);

  // Leaving the cinema or changing film dismisses the sheet.
  useEffect(() => {
    if (!cinemaMode) setSettingsOpen(false);
  }, [cinemaMode]);

  useEffect(() => {
    setSettingsOpen(false);
  }, [filmIndex]);

  // ── CINEMATIC DISSOLVE TRANSITION (Max 1s dissolve into darkness) ──
  const handlePlayCinema = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('dissolving');

    // Trigger preloaded video playback in background
    requestAnimationFrame(() => {
      const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
      if (video) {
        video.play().catch(() => {});
      }
    });

    // 1-second maximum animation: if canplay hasn't fired yet, reveal player after 950ms
    dissolveTimerRef.current = setTimeout(() => {
      setPhase('cinema');
      const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
      if (video) {
        video.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 950);
  }, [phase]);

  // Toggle play / pause
  const togglePlayPause = useCallback(() => {
    const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Lights up — exit cinema, return cleanly to landing, clearing any leaked box-shadow
  const handleLightsUp = useCallback(() => {
    if (dissolveTimerRef.current) clearTimeout(dissolveTimerRef.current);
    const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
    if (video) video.pause();
    setIsPlaying(false);
    setPhase('idle');
    setSettingsOpen(false);
    setCollectionOpen(false);

    // Guarantee that any residual box-shadow applied dynamically is completely eradicated
    requestAnimationFrame(() => {
      const hero = document.querySelector('.spill-hero-left') as HTMLElement | null;
      if (hero) hero.style.boxShadow = '';
      const preview = document.querySelector('.spill-preview-card-wrapper') as HTMLElement | null;
      if (preview) preview.style.boxShadow = '';
    });
  }, []);

  // Prev / Next film
  const handlePrevFilm = useCallback(
    () => setFilmIndex((p) => (p - 1 + films.length) % films.length),
    [films.length]
  );
  const handleNextFilm = useCallback(
    () => setFilmIndex((p) => (p + 1) % films.length),
    [films.length]
  );

  // Collection: switch to a film by id, then dismiss the browser. Picking a film
  // from the landing page starts the cinema, matching the card's action label.
  const handleSelectFilm = useCallback(
    (id: string) => {
      const index = films.findIndex((film) => film.id === id);
      if (index >= 0) setFilmIndex(index);
      setCollectionOpen(false);
      if (phase === 'idle') handlePlayCinema();
    },
    [films, phase, handlePlayCinema]
  );

  // Landing source library: pick a film and go straight into the cinema.
  const handlePlayFilm = useCallback(
    (id: string) => {
      const index = films.findIndex((film) => film.id === id);
      if (index >= 0) setFilmIndex(index);
      handlePlayCinema();
    },
    [films, handlePlayCinema]
  );

  // Add any Mux playback ID (bare ID or a mux.com URL) to the collection.
  // Returns an error message, or null when the film was added.
  const handleAddFilm = useCallback(
    (rawId: string, rawTitle: string): string | null => {
      const playbackId = parsePlaybackId(rawId);
      if (!playbackId) {
        return 'That does not look like a Mux playback ID. Paste the ID or a player.mux.com / stream.mux.com URL.';
      }
      if (films.some((film) => film.playbackId === playbackId)) {
        return 'That film is already in the collection.';
      }

      const slot = DEFAULT_FILMS.length + customFilms.length;
      setCustomFilms((prev) => [
        ...prev,
        {
          id: `custom-${playbackId}`,
          title: rawTitle.trim() || `Mux film ${slot + 1}`,
          duration: 0,
          gradient: CUSTOM_GRADIENTS[slot % CUSTOM_GRADIENTS.length],
          ambientGlow: CUSTOM_GLOWS[slot % CUSTOM_GLOWS.length],
          playbackId,
          poster: `https://image.mux.com/${playbackId}/thumbnail.webp?time=5`,
          custom: true,
        },
      ]);
      return null;
    },
    [films, customFilms.length]
  );

  // Remove a visitor-added film. The two uploaded films always stay.
  const handleRemoveFilm = useCallback(
    (id: string) => {
      const removedIndex = films.findIndex((film) => film.id === id);
      if (removedIndex < 0) return;

      setCustomFilms((prev) => prev.filter((film) => film.id !== id));

      if (currentFilm.id === id) {
        setFilmIndex(0);
      } else if (removedIndex < filmIndex) {
        setFilmIndex((index) => Math.max(0, index - 1));
      }
    },
    [films, currentFilm.id, filmIndex]
  );

  // Seek scrub
  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setCurrentTime(pct * filmDuration);
      const video = document.querySelector('.media-skin video') as HTMLVideoElement | null;
      if (video && video.duration && isFinite(video.duration)) {
        video.currentTime = pct * video.duration;
      }
    },
    [filmDuration]
  );

  // Mobile fullscreen toggle with AR rotation lock
  const handleMobileFullscreen = useCallback(async () => {
    const container = document.querySelector('.spill-mobile-video-container') as HTMLElement | null;
    if (!container) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      try {
        // @ts-ignore
        await screen.orientation?.unlock?.();
      } catch (_) {}
    } else {
      await container.requestFullscreen().catch(() => {});
      try {
        const orientation = videoAR === 'portrait' ? 'portrait-primary' : 'landscape-primary';
        // @ts-ignore
        await screen.orientation?.lock?.(orientation);
      } catch (_) {}
    }
  }, [videoAR]);

  // Global Hotkeys
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      // The collection browser owns the keyboard while it is open, so Escape
      // dismisses the sheet instead of dropping the house lights.
      if (collectionOpen) return;
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (phase === 'idle') handlePlayCinema(); else handleLightsUp();
      } else if (e.key === 'k' || e.key === 'K' || e.key === ' ') {
        e.preventDefault();
        if (phase === 'idle') handlePlayCinema(); else togglePlayPause();
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((p) => !p);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault(); handleNextFilm();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault(); handlePrevFilm();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault(); setCollectionOpen((open) => !open);
      } else if (e.key === 'Escape' && phase !== 'idle') {
        handleLightsUp();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, handlePlayCinema, handleLightsUp, togglePlayPause, handleNextFilm, handlePrevFilm, collectionOpen]);

  const progressPct = filmDuration > 0 ? (currentTime / filmDuration) * 100 : 0;

  // Entire mobile screen influenced by video chromatic projection on dark canvas.
  // The ambient engine publishes the live --film-ambient-glow; this static value is
  // only the fallback for idle / non-cinema states.
  const rootStyle = {
    '--film-fallback-glow': currentFilm.ambientGlow,
  } as React.CSSProperties;

  return (
    <div
      className="spill-app-root"
      data-phase={phase}
      data-cinema={cinemaMode ? 'true' : 'false'}
      data-mobile-ui={mobileUiVisible ? 'true' : 'false'}
      style={rootStyle}
    >
      {/* ── Custom SPILL Cursor: luminous dot & ring ── */}
      <div ref={cursorDotRef} className="spill-cursor-dot" aria-hidden="true" />
      <div ref={cursorRingRef} className="spill-cursor-ring" aria-hidden="true" />

      {/* ── 1-Second Dissolve Overlay into darkness ── */}
      {isDissolving && (
        <div className="spill-dissolve-overlay" aria-hidden="true">
          <div className="spill-dissolve-loading">
            <div className="spill-dissolve-spinner" />
          </div>
        </div>
      )}

      {/* ── Preloading Video Player: Buffers video during dissolve ── */}
      {showPlayer && !cinemaMode && (
        <div className="spill-preload-video" aria-hidden="true">
          <VideoPlayer key={currentFilm.id} poster={posterUrl}>
            <VideoSkin ambientGlow={false} controls={false} showKeyStrip={false}>
              <MuxVideo src={videoSrc} playsInline crossOrigin="" preload="auto" />
            </VideoSkin>
          </VideoPlayer>
        </div>
      )}

      {/* ── Ambient Glow Background Orbs (Desktop Cinema) ── */}
      <div className="spill-ambient-backdrop" aria-hidden="true">
        <div className="spill-glow-orb-1" />
        <div className="spill-glow-orb-2" />
        <div className="spill-glow-orb-3" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="spill-nav">
        {cinemaMode && isMobile ? (
          <span className="spill-logo-plain">SPILL</span>
        ) : (
          <a href="#" className="spill-logo" onClick={(e) => { e.preventDefault(); handleLightsUp(); }}>
            <span className="spill-logo-dot" />
            <span>SPILL</span>
          </a>
        )}

        <div className="spill-nav-links">
          {cinemaMode && isMobile ? (
            <button type="button" className="spill-lights-up-btn" onClick={handleLightsUp} aria-label="Lights up">
              Lights up
            </button>
          ) : cinemaMode && !isMobile ? (
            <>
              <button type="button" className="spill-lights-up-btn" onClick={handleLightsUp}>
                <span>Lights up</span>
                <span className="spill-key-badge">L</span>
              </button>
              <button
                type="button"
                className="spill-lights-up-btn"
                onClick={() => setCollectionOpen(true)}
                aria-haspopup="dialog"
              >
                <span>Collection</span>
                <span className="spill-key-badge">C</span>
              </button>
              <button
                type="button"
                className="spill-lights-up-btn spill-shortcuts-btn"
                onClick={() => setShortcutsOpen(true)}
                title="Keyboard shortcuts"
              >
                <span className="font-mono text-xs">?</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" className="spill-nav-link" onClick={() => setCollectionOpen(true)}>
                Collection
              </button>
              <button type="button" className="spill-nav-link" onClick={() => setDesignNotesOpen(true)}>
                Design notes
              </button>
              <button type="button" className="spill-nav-link" onClick={() => setShortcutsOpen(true)}>
                Shortcuts
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Main Layout Body ── */}
      <main className="spill-main-container">

        {/* ══ MOBILE CINEMA MODE (Frame 1): 100% UNBLOCK VIDEO, NO BOTTOM PROGRAMME SECTION ══ */}
        {cinemaMode && isMobile ? (
          <div
            className="spill-mobile-cinema-layout"
            data-ui-visible={mobileUiVisible ? 'true' : 'false'}
            onPointerDown={beginMobileUiInteraction}
            onPointerUp={revealMobileUi}
            onPointerCancel={revealMobileUi}
          >

            {/* Stage keeps the video optically centred when the chrome is away */}
            <div className="spill-mobile-video-stage">
              <div className="spill-mobile-video-container" data-ar={videoAR}>
                <span className="spill-mobile-video-badge">1080p</span>
                {/* No poster on mobile — native video poster creates a dark thumbnail "mask"
                    over the player. Pure black bg (from .media-skin bg-black) is the correct
                    pre-play state: dark canvas that the video illuminates when it starts. */}
                <VideoPlayer key={currentFilm.id}>
                  <VideoSkin ambientGlow controls={false} showKeyStrip={false}>
                    <MuxVideo src={videoSrc} playsInline crossOrigin="" />
                  </VideoSkin>
                  <MobileSettingsSheet
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    playbackRate={playbackRate}
                    onPlaybackRate={setPlaybackRate}
                    captionsAvailable={captionsAvailable}
                    captionsOn={captionsOn}
                    onCaptionsToggle={() => setCaptionsOn((value) => !value)}
                    loop={loop}
                    onLoopToggle={() => setLoop((value) => !value)}
                  />
                </VideoPlayer>
              </div>
            </div>

            {/* Chrome — title, time, seek reel and controls fade + collapse away */}
            <div
              className="spill-mobile-chrome-shell"
              aria-hidden={!mobileUiVisible}
              inert={!mobileUiVisible}
            >
              <div className="spill-mobile-chrome">

                {/* Title row */}
                <div className="spill-mobile-info-header">
                  <h2 className="spill-mobile-title font-editorial-serif">{currentFilm.title}</h2>
                </div>

                {/* Colour Reel seekbar */}
                <div className="spill-mobile-seek-wrapper">
                  <div className="spill-mobile-time-chip-track">
                    <div
                      className="spill-mobile-time-chip"
                      style={{ left: `${Math.min(90, Math.max(10, progressPct))}%` }}
                    >
                      {formatTime(currentTime)}
                    </div>
                  </div>
                  <div className="spill-mobile-color-bar" onClick={handleScrub}>
                    {COLOUR_REEL_PALETTE.map((color, i) => (
                      <div key={i} className="spill-color-segment" style={{ backgroundColor: color }} />
                    ))}
                    <div className="spill-mobile-playhead-line" style={{ left: `${progressPct}%` }} />
                  </div>
                  <div className="spill-mobile-seek-meta">
                    <span>Drag to scrub</span>
                    <span>{formatTime(filmDuration)}</span>
                  </div>
                </div>

                {/* Primary controls: Prev, Big Pink Pause, Next */}
                <div className="spill-mobile-controls-row">
                  <button type="button" className="spill-mobile-icon-btn" onClick={handlePrevFilm} aria-label="Previous film">
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 5v14h2.5V5H6zm3.5 7 10.5 7V5l-10.5 7z" />
                    </svg>
                  </button>
                  <button type="button" className="spill-mobile-main-play-btn" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? (
                      <svg className="size-7 text-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="size-7 text-black ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button type="button" className="spill-mobile-icon-btn" onClick={handleNextFilm} aria-label="Next film">
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="m4 19 10.5-7L4 5v14zm11.5-14v14H18V5h-2.5z" />
                    </svg>
                  </button>
                </div>

                {/* Secondary controls: Volume, CC, Collection, Settings, Fullscreen */}
                <div className="spill-mobile-secondary-row">
                  <button
                    type="button"
                    className="spill-mobile-sec-btn"
                    onClick={() => setMuted((value) => !value)}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    aria-pressed={muted}
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      {muted && <path d="M4 3.5 20.5 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />}
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="spill-mobile-sec-btn spill-sec-label"
                    onClick={() => setCaptionsOn((value) => !value)}
                    aria-label={captionsOn ? 'Turn captions off' : 'Turn captions on'}
                    aria-pressed={captionsOn}
                    disabled={!captionsAvailable}
                    title={captionsAvailable ? 'Captions' : 'No captions available for this film'}
                  >
                    CC
                  </button>
                  <button
                    type="button"
                    className="spill-mobile-sec-btn"
                    onClick={() => {
                      setCollectionOpen(true);
                      revealMobileUi();
                    }}
                    aria-label="Film collection"
                    aria-haspopup="dialog"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 3 2 8l10 5 10-5-10-5z" />
                      <path d="m2 13 10 5 10-5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="spill-mobile-sec-btn"
                    onClick={() => {
                      setSettingsOpen(true);
                      revealMobileUi();
                    }}
                    aria-label="Player settings"
                    aria-haspopup="dialog"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
                      <circle cx="15" cy="7" r="2" />
                      <circle cx="9" cy="17" r="2" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="spill-mobile-sec-btn"
                    onClick={handleMobileFullscreen}
                    aria-label="Fullscreen"
                    title={videoAR === 'portrait' ? 'Fullscreen Portrait' : 'Fullscreen Landscape'}
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      {videoAR === 'portrait' ? (
                        <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3" />
                      ) : (
                        <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                      )}
                    </svg>
                  </button>
                </div>

              </div>
            </div>

          </div>

        ) : cinemaMode && !isMobile ? (
          /* ══ DESKTOP CINEMA MODE (Frame 3) ══ */
          <div className="spill-cinema-wrapper">
            <VideoPlayer key={currentFilm.id} poster={posterUrl}>
              <VideoSkin
                ambientGlow={true}
                title={currentFilm.title}
                programmeText={`Collection ${filmIndex + 1}/${films.length}`}
                onProgrammeClick={() => setCollectionOpen(true)}
              >
                <MuxVideo src={videoSrc} playsInline crossOrigin="" />
              </VideoSkin>
            </VideoPlayer>
          </div>

        ) : (
          /* ══ LANDING VIEW (Frame 2): Light warm cream design ══ */
          <>
            <div className="spill-hero-grid">
              {/* Left column */}
              <div className={`spill-hero-left${isDissolving ? ' is-dissolving' : ''}`}>
                <div className="spill-hero-tag">A VIDEO.JS V10 SKIN</div>
                <h1 className="spill-hero-title font-editorial-serif">
                  Let the video <br />
                  <span className="spill-accent-word">light</span> the room.
                </h1>
                <p className="spill-hero-desc">
                  Spill paints the page with the colours of whatever you are watching. Press play
                  and the house lights go down.
                </p>
                <div className="spill-hero-cta-row">
                  <button type="button" className="spill-play-film-btn" onClick={handlePlayCinema}>
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    <span>Play the film</span>
                  </button>
                  <button
                    type="button"
                    className="spill-shortcuts-cta"
                    onClick={() => setShortcutsOpen(true)}
                  >
                    K to play&nbsp;•&nbsp;? for shortcuts
                  </button>
                </div>
              </div>

              {/* Right column — video preview card */}
              <div className={`spill-preview-card-wrapper${isDissolving ? ' is-dissolving' : ''}`}>
                <div className="spill-preview-ambient-glow" />
                <div
                  className="spill-preview-card"
                  onClick={handlePlayCinema}
                  role="button"
                  tabIndex={0}
                  aria-label="Play video"
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlayCinema(); } }}
                >
                  <img src={posterUrl} alt={`${currentFilm.title} thumbnail`} className="spill-preview-poster" />
                  <div className="spill-card-badge">
                    <span>{currentFilm.title}</span>
                    <span className="opacity-40">•</span>
                    <span className="font-mono text-white/80">
                      {filmDuration > 0 ? formatTime(filmDuration) : 'New'}
                    </span>
                  </div>
                  <button type="button" className="spill-card-play-btn" aria-label="Play" onClick={(e) => { e.stopPropagation(); handlePlayCinema(); }}>
                    <svg className="size-6 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                  <div className="spill-card-color-bar">
                    {COLOUR_REEL_PALETTE.map((color, i) => (
                      <div key={i} className="spill-color-segment" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature columns */}
            <div className={`spill-features-row${isDissolving ? ' is-dissolving' : ''}`}>
              <div className="spill-feature-col">
                <div className="spill-feature-num">01</div>
                <h3 className="spill-feature-title font-editorial-serif">The Colour Reel</h3>
                <p className="spill-feature-text">The seek bar is the film's colour story. See the sunsets and the dark scenes before you get to them.</p>
              </div>
              <div className="spill-feature-col">
                <div className="spill-feature-num">02</div>
                <h3 className="spill-feature-title font-editorial-serif">The room responds</h3>
                <p className="spill-feature-text">Glow, page and controls take their colour from the scene. Text colours stay fixed, so nothing gets hard to read.</p>
              </div>
              <div className="spill-feature-col">
                <div className="spill-feature-num">03</div>
                <h3 className="spill-feature-title font-editorial-serif">Collection and keys</h3>
                <p className="spill-feature-text">Jump between films with N and P, and learn every shortcut as you use it.</p>
              </div>
            </div>

            {/* Mux source library — proves both films are real uploaded Mux assets */}
            <section
              className={`spill-library${isDissolving ? ' is-dissolving' : ''}`}
              aria-labelledby="mux-library-title"
            >
              <div className="spill-library-header">
                <div>
                  <div className="spill-library-eyebrow">HOSTED ON MUX</div>
                  <h2 id="mux-library-title" className="spill-library-title font-editorial-serif">
                    Mux source library
                  </h2>
                </div>
                <p className="spill-library-intro">
                  Every film here is a real Mux asset. Press play, add another playback ID from the
                  collection, or copy an ID straight into your own player.
                </p>
              </div>

              <div className="spill-library-grid">
                {films.map((film) => {
                  const playbackId = film.playbackId ?? MUX_PLAYBACK_ID;
                  return (
                    <article key={film.id} className="spill-library-card">
                      <img
                        className="spill-library-thumb"
                        src={
                          film.poster ??
                          `https://image.mux.com/${playbackId}/thumbnail.webp?time=10`
                        }
                        alt={`${film.title} thumbnail`}
                        loading="lazy"
                      />
                      <div className="spill-library-body">
                        <div className="spill-library-card-head">
                          <h3 className="spill-library-card-title font-editorial-serif">
                            {film.title}
                          </h3>
                          <span className="spill-library-duration">
                            {film.duration > 0 ? formatTime(film.duration) : 'New'}
                          </span>
                        </div>

                        <div className="spill-library-id-block">
                          <div className="spill-library-id-label">Mux playback ID</div>
                          <code className="spill-library-id">{playbackId}</code>
                        </div>

                        <div className="spill-library-actions">
                          <button
                            type="button"
                            className="spill-library-play"
                            onClick={() => handlePlayFilm(film.id)}
                          >
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            Play this film
                          </button>
                          <a
                            className="spill-library-hls"
                            href={`https://stream.mux.com/${playbackId}.m3u8`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            HLS stream ↗
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <footer className={`spill-footer${isDissolving ? ' is-dissolving' : ''}`}>
              <span>A Video.js v10 skin</span>
              <span>Video hosted on Mux</span>
            </footer>
          </>
        )}
      </main>

      {/* ── Shortcuts Modal ── */}
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* ── Collection browser: bottom sheet on mobile, modal on desktop ── */}
      <CollectionPanel
        open={collectionOpen}
        films={films.map((film) => ({
          id: film.id,
          title: film.title,
          duration:
            film.id === currentFilm.id && mediaDuration > 0 ? mediaDuration : film.duration,
          playbackId: film.playbackId ?? MUX_PLAYBACK_ID,
          poster: film.poster,
          gradient: film.gradient,
          custom: film.custom,
        }))}
        currentFilmId={currentFilm.id}
        onSelect={handleSelectFilm}
        onAdd={handleAddFilm}
        onRemove={handleRemoveFilm}
        onClose={() => setCollectionOpen(false)}
      />

      {/* ── Design Notes Modal ── */}
      {designNotesOpen && (
        <div className="spill-modal-backdrop" onClick={() => setDesignNotesOpen(false)} role="dialog" aria-modal="true">
          <div className="spill-modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="spill-modal-close-btn" onClick={() => setDesignNotesOpen(false)} aria-label="Close">✕</button>
            <h3 className="text-xl font-semibold mb-2 font-editorial-serif text-white">Design Notes — SPILL</h3>
            <p className="text-xs font-mono text-[#FF4D85] mb-4">A Video.js v10 Skin for Mux</p>
            <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
              <p><strong>The Colour Reel:</strong> Rather than a single monochrome scrub line, SPILL extracts the dominant chromatic signature of the film across time, giving viewers a visual synopsis of scene transitions and hues before they arrive.</p>
              <p><strong>The Room Responds:</strong> An ambient real-time sampling engine casts soft, reactive backlight halos onto the surroundings. Press play and the house lights go down; press <code>L</code> and the room lights turn back on.</p>
              <p><strong>Built for Video.js 10:</strong> Utilizes native Video.js React primitives, Tailwind CSS v4, and Mux Video streaming.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
