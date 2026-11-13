/** @jsxImportSource react */

'use client';

import { useEffect, useRef, useState, type FormEvent, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';

export interface CollectionFilm {
  id: string;
  title: string;
  duration: number;
  playbackId: string;
  poster?: string;
  gradient?: string;
  /** True for films the visitor added from a playback ID. */
  custom?: boolean;
}

export interface CollectionPanelProps {
  open: boolean;
  films: CollectionFilm[];
  currentFilmId: string;
  onSelect: (id: string) => void;
  /** Add a film by playback ID / Mux URL. Returns an error message, or null on success. */
  onAdd: (playbackId: string, title: string) => string | null;
  /** Remove a visitor-added film. */
  onRemove: (id: string) => void;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * The programme / collection browser.
 *
 * Mobile: a swipe-dismissible bottom sheet with one card per film.
 * Desktop: a centred modal with the films in two columns.
 *
 * Each card prints the real Mux playback ID, so the collection doubles as proof
 * of where the streams come from. Visitors can add any Mux playback ID and play
 * it immediately; those films stay in this browser.
 */
export function CollectionPanel({
  open,
  films,
  currentFilmId,
  onSelect,
  onAdd,
  onRemove,
  onClose,
}: CollectionPanelProps) {
  const touchStartY = useRef<number | null>(null);
  const [playbackIdInput, setPlaybackIdInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Close only the panel; don't also drop the house lights.
      event.stopPropagation();
      event.preventDefault();
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose]);

  // Clear the add form whenever the panel closes.
  useEffect(() => {
    if (open) return;
    setPlaybackIdInput('');
    setTitleInput('');
    setAddError(null);
  }, [open]);

  const handleTouchStart = (event: TouchEvent) => {
    touchStartY.current = event.touches[0].clientY;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = event.changedTouches[0].clientY - touchStartY.current;
    if (dy > 90) onClose();
    touchStartY.current = null;
  };

  const handleAddSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = onAdd(playbackIdInput, titleInput);
    if (message) {
      setAddError(message);
      return;
    }
    setPlaybackIdInput('');
    setTitleInput('');
    setAddError(null);
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="spill-collection-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Film collection"
      onClick={onClose}
    >
      <div
        className="spill-collection-panel"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="spill-collection-handle" aria-hidden="true" />

        <div className="spill-collection-header">
          <div>
            <span className="spill-collection-eyebrow">COLLECTION</span>
            <h2 className="spill-collection-title font-editorial-serif">The programme</h2>
            <p className="spill-collection-subtitle">
              {films.length} {films.length === 1 ? 'film' : 'films'} · streamed from Mux
            </p>
          </div>
          <button
            type="button"
            className="spill-collection-close"
            onClick={onClose}
            aria-label="Close film collection"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form className="spill-collection-add" onSubmit={handleAddSubmit}>
          <label className="spill-collection-add-label" htmlFor="spill-collection-playback-id">
            Add a film from Mux
          </label>
          <div className="spill-collection-add-fields">
            <input
              id="spill-collection-playback-id"
              className="spill-collection-input"
              name="playbackId"
              type="text"
              value={playbackIdInput}
              onChange={(event) => {
                setPlaybackIdInput(event.target.value);
                if (addError) setAddError(null);
              }}
              placeholder="Playback ID or player.mux.com link"
              autoComplete="off"
              spellCheck={false}
              required
              aria-invalid={addError ? true : undefined}
              aria-describedby={
                addError ? 'spill-collection-add-error' : 'spill-collection-add-hint'
              }
            />
            <input
              className="spill-collection-input spill-collection-input-title"
              name="title"
              type="text"
              value={titleInput}
              onChange={(event) => setTitleInput(event.target.value)}
              placeholder="Title (optional)"
              aria-label="Film title (optional)"
              autoComplete="off"
            />
            <button type="submit" className="spill-collection-add-btn">
              Add film
            </button>
          </div>
          {addError ? (
            <p className="spill-collection-add-error" id="spill-collection-add-error" role="alert">
              {addError}
            </p>
          ) : (
            <p className="spill-collection-add-hint" id="spill-collection-add-hint">
              Any Mux asset works. Added films stay in this browser.
            </p>
          )}
        </form>

        <div className="spill-collection-list">
          {films.map((film, index) => {
            const active = film.id === currentFilmId;
            const durationLabel = film.duration > 0 ? formatDuration(film.duration) : 'New';

            return (
              <div
                key={film.id}
                className={`spill-collection-card${active ? ' is-active' : ''}${
                  film.custom ? ' is-custom' : ''
                }`}
              >
                <button
                  type="button"
                  className="spill-collection-select"
                  onClick={() => onSelect(film.id)}
                  aria-pressed={active}
                  aria-label={`${film.title}, ${durationLabel}${active ? ', now playing' : ''}`}
                >
                  <span
                    className="spill-collection-thumb"
                    style={
                      film.poster
                        ? { backgroundImage: `url("${film.poster}")` }
                        : { backgroundImage: film.gradient }
                    }
                    aria-hidden="true"
                  >
                    <span className="spill-collection-thumb-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {active ? <span className="spill-collection-now">Now playing</span> : null}
                  </span>

                  <span className="spill-collection-body">
                    <span className="spill-collection-card-head">
                      <span className="spill-collection-card-title font-editorial-serif">
                        {film.title}
                      </span>
                      <span className="spill-collection-card-duration">{durationLabel}</span>
                    </span>

                    <span className="spill-collection-id-label">Mux playback ID</span>
                    <code className="spill-collection-id">{film.playbackId}</code>

                    <span className="spill-collection-card-action">
                      {active ? 'Playing now' : 'Play this film'}
                      <span aria-hidden="true">→</span>
                    </span>
                  </span>
                </button>

                {film.custom ? (
                  <button
                    type="button"
                    className="spill-collection-remove"
                    onClick={() => onRemove(film.id)}
                    aria-label={`Remove ${film.title} from collection`}
                    title="Remove from collection"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="spill-collection-footnote">Select a film to load its Mux stream.</p>
      </div>
    </div>,
    document.body
  );
}
