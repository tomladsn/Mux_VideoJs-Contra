/** @jsxImportSource react */

import { Title as TitlePrimitive } from '@videojs/react';

import { cn } from '@/lib/resolve-class-name';

export function Title() {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {/* 4K HDR badge pill */}
      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 backdrop-blur-md">
        <span className="size-1.5 animate-pulse rounded-full bg-sky-400" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-300">4K HDR</span>
      </div>

      {/* Video title — truncates when space is tight */}
      <TitlePrimitive
        className={cn(
          'pointer-events-none min-w-0 flex-1 truncate font-medium text-white/95 drop-shadow-sm',
          'text-xs media-sm:text-sm',
          'not-data-visible:opacity-0'
        )}
      />
    </div>
  );
}
