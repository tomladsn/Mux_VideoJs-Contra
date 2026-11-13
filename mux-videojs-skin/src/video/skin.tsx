/** @jsxImportSource react */

'use client';

import '../styles/video/scaffold.css';
import { Container as ContainerPrimitive, Poster as PosterPrimitive, Slider as SliderPrimitive } from '@videojs/react';
import { useState, type ReactNode } from 'react';

import { cn } from '@/lib/resolve-class-name';

import { VideoGestures } from './behaviors/gestures';
import { VideoHotkeys } from './behaviors/hotkeys';
import { VideoControls } from './controls';
import { ErrorDialog } from './shared/error-dialog';
import { Indicators } from './shared/indicators';
import { SeekIndicator } from './shared/seek-indicator';
import { StatusAnnouncer } from './shared/status-announcer';
import { Poster } from './shared/video-feedback';
import { AmbientGlow } from './ambient-glow';

// SPILL Teaching & Shortcuts
import { ShortcutsOverlay } from './spill/shortcuts-overlay';
import { FirstVisitChip } from './spill/first-visit-chip';
import { FeedbackProvider } from './spill/on-screen-feedback';
import { KeyStrip } from './spill/key-strip';
import { LoadingState } from './spill/states';

export interface VideoSkinProps extends Omit<ContainerPrimitive.Props, 'children'> {
  children?: ReactNode;
  renderPoster?: PosterPrimitive.ImageProps['render'];
  renderThumbnail?: SliderPrimitive.Thumbnail.ImageProps['render'];
  /** Set false to disable the ambient reactive backlight glow. Default: true */
  ambientGlow?: boolean;
  /** Set false to hide internal controls (e.g. for custom mobile UI). Default: true */
  controls?: boolean;
  /** Set false to hide desktop key strip. Default: true */
  showKeyStrip?: boolean;
  /** Title shown in the top-left pill of the player controls. */
  title?: string;
  /** Programme/collection badge text, e.g. "Collection 1/2". */
  programmeText?: string;
  /** Called when the programme badge is pressed. */
  onProgrammeClick?: () => void;
}

export function VideoSkin({
  children,
  className,
  renderPoster,
  renderThumbnail,
  ambientGlow = true,
  controls = true,
  showKeyStrip = true,
  title,
  programmeText,
  onProgrammeClick,
  ...props
}: VideoSkinProps = {}) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <FeedbackProvider>
      <ContainerPrimitive
        className={cn(
          'media-skin',
          'relative block h-full w-full overflow-hidden rounded-media-player [--spacing:var(--media-spacing)] [font-family:var(--media-font-family,inherit)] text-media text-media-foreground @container/media-root',
          'outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-media-ring',
          'bg-black',
          className
        )}
        data-theme="scaffold"
        data-preset="video"
        {...props}
      >
        {/* Ambient backlight engine */}
        <AmbientGlow enabled={ambientGlow} />

        {children}
        <Poster renderImage={renderPoster} />
        <ErrorDialog />
        <LoadingState />
        {controls && (
          <VideoControls
            renderThumbnail={renderThumbnail}
            title={title}
            programmeText={programmeText}
            onProgrammeClick={onProgrammeClick}
          />
        )}
        <VideoHotkeys onOpenShortcuts={() => setShortcutsOpen(true)} />
        <VideoGestures />
        <StatusAnnouncer />
        <Indicators>
          <SeekIndicator />
        </Indicators>

        {/* First-visit onboarding badge */}
        {controls && <FirstVisitChip onClick={() => setShortcutsOpen(true)} />}

        {/* Shortcuts focus-trapped dialog */}
        <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </ContainerPrimitive>

      {/* Desktop-only Keycap row strip under the player */}
      {showKeyStrip && controls && <KeyStrip />}
    </FeedbackProvider>
  );
}
