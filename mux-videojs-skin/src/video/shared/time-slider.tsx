/** @jsxImportSource react */

import { Slider as SliderPrimitive } from '@videojs/react';
import { TimeSlider as TimeSliderPrimitive } from '@videojs/react';

import { cn } from '@/lib/resolve-class-name';

export function TimeSlider({ audio = false, renderThumbnail }: ThumbnailSlot & { audio?: boolean } = {}) {
  return (
    <div className="w-full">
      <TimeSliderPrimitive.Root
        className={cn(
          // Extra vertical padding = fat touch target on mobile, visually stays slim
          'group/slider relative flex h-5 min-w-12 flex-1 cursor-pointer items-center py-1.5',
          'data-disabled:cursor-not-allowed data-disabled:opacity-40 forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100'
        )}
        thumbAlignment="edge"
      >
        <TimeSliderPrimitive.Chapters
          className="relative flex size-full items-center"
          renderChapter={(props) => (
            <div
              className={cn(
                'absolute inset-0 flex items-center clip-media-chapter-x',
                '[--media-chapter-inset-start:0.5] [--media-chapter-inset-end:0.5]',
                'first-of-type:[--media-chapter-inset-start:0] last-of-type:[--media-chapter-inset-end:0]'
              )}
              {...props}
            >
              <TimeSliderPrimitive.Track
                className={cn(
                  'absolute inset-x-0 isolate h-1.5 rounded-full',
                  // Track background
                  'before:absolute before:inset-y-0 before:rounded-full before:bg-white/15 before:clip-media-chapter-track-x',
                  'forced-colors:before:bg-[Canvas] forced-colors:before:opacity-100! forced-colors:before:forced-color-adjust-none',
                  'forced-colors:before:border forced-colors:before:border-solid forced-colors:before:border-[CanvasText]',
                  audio && 'before:bg-media-muted! forced-colors:before:bg-[Canvas]!'
                )}
              >
                {/* Buffered range */}
                <TimeSliderPrimitive.Buffer
                  className={cn(
                    'absolute inset-y-0 rounded-full bg-white/25 clip-media-x-[--media-slider-buffer]',
                    'forced-colors:opacity-100! forced-colors:forced-color-adjust-none',
                    'forced-colors:bg-[repeating-linear-gradient(135deg,CanvasText_0px,CanvasText_1px,Canvas_1px,Canvas_3px)]',
                    audio && 'bg-[#b3b3b3]!'
                  )}
                />
                {/* Played range — sky-cyan accent with subtle glow */}
                <TimeSliderPrimitive.Fill
                  className={cn(
                    'absolute inset-y-0 rounded-full bg-media-accent clip-media-x-[--media-slider-fill]',
                    'shadow-[0_0_6px_rgba(56,189,248,0.45)]',
                    'group-data-dragging/slider:clip-media-x-[--media-slider-pointer]',
                    'forced-colors:forced-color-adjust-none forced-colors:bg-[Canvas] forced-colors:bg-[linear-gradient(Highlight,Highlight)]'
                  )}
                />
              </TimeSliderPrimitive.Track>
            </div>
          )}
        ></TimeSliderPrimitive.Chapters>

        {/* Scrubber thumb — glowing white dot */}
        <TimeSliderPrimitive.Thumb
          className={cn(
            'absolute left-[var(--media-slider-fill,0%)] size-3.5 -translate-x-1/2 rounded-full',
            'border border-white/60 bg-white shadow-[0_0_10px_rgba(56,189,248,0.75)]',
            'transition-transform duration-100 hover:scale-125',
            'group-data-dragging/slider:left-(--media-slider-pointer) group-data-dragging/slider:scale-125',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
            'forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText] forced-colors:bg-[Highlight] forced-colors:forced-color-adjust-none'
          )}
        />

        {/* Hover / drag preview card */}
        <TimeSliderPrimitive.Preview
          className={cn(
            'pointer-events-none bottom-[calc(100%+var(--media-spacing)*3)] grid max-w-44 origin-bottom justify-items-center gap-1.5',
            'opacity-0 transition-opacity duration-150 group-data-disabled/slider:hidden',
            'group-data-dragging/slider:opacity-100 group-data-pointing/slider:opacity-100'
          )}
        >
          {/* Thumbnail frame */}
          <SliderPrimitive.Thumbnail.Root
            className="block max-w-44 overflow-hidden rounded-xl border border-white/20 bg-neutral-950/90 p-1 shadow-2xl backdrop-blur-md"
          >
            <SliderPrimitive.Thumbnail.Image render={renderThumbnail} className="block rounded-lg" />
          </SliderPrimitive.Thumbnail.Root>

          {/* Time + chapter label */}
          <div
            className={cn(
              'flex w-full min-w-0 justify-center rounded-lg border border-white/15 bg-neutral-950/90 px-2.5 py-1 text-xs text-white shadow-xl backdrop-blur-md',
              audio && 'w-auto! rounded-lg px-1.5! py-0.5 media-high-contrast:outline forced-colors:outline'
            )}
          >
            <div className="flex max-w-full min-w-0 items-center gap-2">
              <TimeSliderPrimitive.Value
                className="shrink-0 font-mono font-medium tabular-nums text-sky-400"
                type="pointer"
              />
              <TimeSliderPrimitive.ChapterTitle className="min-w-0 truncate text-white/70 empty:hidden" />
            </div>
          </div>
        </TimeSliderPrimitive.Preview>
      </TimeSliderPrimitive.Root>
    </div>
  );
}

export interface ThumbnailSlot {
  /** Draws the storyboard frame in the slider preview in place of the one the skin renders. */
  renderThumbnail?: SliderPrimitive.Thumbnail.ImageProps['render'];
}

export { ColourReel } from '../spill/colour-reel';
