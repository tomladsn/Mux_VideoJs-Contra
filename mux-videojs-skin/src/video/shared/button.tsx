import type { ComponentProps } from 'react';

import { cn } from '@/lib/resolve-class-name';

export type ButtonProps = ComponentProps<'button'>;

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-transparent p-0 text-inherit transition-all duration-150',
        "pointer-coarse:before:absolute pointer-coarse:before:-inset-[6px] pointer-coarse:before:content-['']",
        'hover:bg-white/15 hover:scale-105 active:scale-95 focus-visible:bg-white/20 aria-expanded:bg-white/20',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-media-ring',
        'outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40 disabled:cursor-not-allowed disabled:opacity-40',
        'media-high-contrast:hover:bg-media-foreground media-high-contrast:hover:text-media-background media-high-contrast:focus-visible:bg-media-foreground media-high-contrast:focus-visible:text-media-background',
        'media-high-contrast:aria-expanded:bg-media-foreground media-high-contrast:aria-expanded:text-media-background',
        'forced-colors:border forced-colors:border-solid forced-colors:border-[ButtonText] forced-colors:bg-[ButtonFace] forced-colors:text-[ButtonText]',
        'forced-colors:forced-color-adjust-none',
        'forced-colors:hover:bg-[Highlight] forced-colors:hover:text-[HighlightText] forced-colors:focus-visible:bg-[Highlight] forced-colors:focus-visible:text-[HighlightText]',
        'forced-colors:aria-expanded:bg-[Highlight] forced-colors:aria-expanded:text-[HighlightText] forced-colors:aria-disabled:text-[GrayText] forced-colors:aria-disabled:opacity-100',
        'data-hidden:hidden',
        className
      )}
      {...props}
    />
  );
}
