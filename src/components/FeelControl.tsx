import { memo } from 'react';
import clsx from 'clsx';
import {
  FEEL_OPTIONS,
  FEEL_LABELS,
  feelToSubdivision,
  feelIsSwung,
  deriveFeel,
  DEFAULT_SWUNG_INTENSITY,
} from '@fretwork/lib';
import type { Feel, SubdivisionId } from '@fretwork/lib';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Slider } from './ui/slider';

interface FeelControlProps {
  subdivision: SubdivisionId;
  swing: number;
  onSubdivision: (id: SubdivisionId) => void;
  onSwing: (swing: number) => void;
}

const SWING_MIN = 0.5;
const SWING_MAX = 0.95;

/** Compact labels so all seven feels fit one line on a phone; the full
 *  `FEEL_LABELS` text is kept as the accessible name + tooltip. */
const FEEL_SHORT: Record<Feel, string> = {
  off: 'Off',
  'straight-8ths': '8th',
  'swung-8ths': 'Sw 8th',
  triplets: 'Trip',
  'straight-16ths': '16th',
  'swung-16ths': 'Sw 16th',
  sextuplets: 'Sext',
};

/**
 * Presents the underlying (subdivision, swing) pair as one friendly "feel"
 * choice. Swing intensity only matters for the two swung feels, so its slider
 * is shown (enabled) only then — and reserves its row height so neighbours
 * don't shift when it toggles.
 */
export const FeelControl = memo(function FeelControl({
  subdivision,
  swing,
  onSubdivision,
  onSwing,
}: FeelControlProps) {
  const current: Feel = deriveFeel(subdivision, swing);
  const swung = feelIsSwung(current);

  const selectFeel = (feel: Feel) => {
    onSubdivision(feelToSubdivision(feel));
    if (feelIsSwung(feel)) {
      // Keep a prior swing intensity if there is one; otherwise seed a default.
      onSwing(swing > SWING_MIN ? swing : DEFAULT_SWUNG_INTENSITY);
    } else {
      onSwing(SWING_MIN); // straight
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="font-mono text-2xs uppercase tracking-label text-muted-foreground">
        Feel
      </span>
      {/* One centered line, sized to fit a phone without scrolling. */}
      <div className="flex w-full justify-center">
        <ToggleGroup
          type="single"
          value={current}
          // Radix single-select allows deselect (→ ''); keep one always selected.
          onValueChange={(v) => {
            if (v) selectFeel(v as Feel);
          }}
          className="flex max-w-full flex-nowrap gap-0.5 rounded-full bg-card p-1 shadow-btn"
        >
          {FEEL_OPTIONS.map((feel) => (
            <ToggleGroupItem
              key={feel}
              value={feel}
              title={FEEL_LABELS[feel]}
              aria-label={FEEL_LABELS[feel]}
              className="shrink-0 whitespace-nowrap rounded-full px-1.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {FEEL_SHORT[feel]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Swing intensity — reserved height; inert when the feel isn't swung. */}
      <div className={clsx('flex h-7 items-center gap-2 transition-opacity', swung ? 'opacity-100' : 'opacity-30')}>
        <span className="font-mono text-2xs uppercase tracking-wider text-muted-foreground">
          Swing
        </span>
        <Slider
          min={SWING_MIN}
          max={SWING_MAX}
          step={0.01}
          value={[swing]}
          disabled={!swung}
          onValueChange={([v]) => onSwing(v)}
          aria-label="Swing intensity"
          className="w-32"
        />
        <span className="w-8 font-mono text-2xs tabular-nums text-muted-foreground">
          {Math.round(((swing - SWING_MIN) / (SWING_MAX - SWING_MIN)) * 100)}%
        </span>
      </div>
    </div>
  );
});
