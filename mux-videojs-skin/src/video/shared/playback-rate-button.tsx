/** @jsxImportSource react */

import { PlaybackRateButton as PlaybackRateButtonPrimitive } from '@videojs/react';

import { Button } from './button';
import { ButtonTooltip } from './tooltip';

/** A direct, keyboard-operable shortcut that cycles through the configured playback rates. */
export function PlaybackRateButton() {
  return (
    <ButtonTooltip>
      <PlaybackRateButtonPrimitive
        render={(props, state) => (
          <Button {...props} className="text-xs font-semibold tabular-nums">
            {state.rate}×
          </Button>
        )}
      />
    </ButtonTooltip>
  );
}
