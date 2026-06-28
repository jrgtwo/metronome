import { memo, type CSSProperties } from 'react';
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
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Feel
      </span>
      {/* One centered line, sized to fit a phone without scrolling. */}
      <div className="flex w-full justify-center">
        <div className="flex max-w-full flex-nowrap gap-0.5 rounded-full bg-card p-1 shadow-[0_3px_0_hsl(var(--shadow))]">
          {FEEL_OPTIONS.map((feel) => {
            const selected = feel === current;
            return (
              <button
                key={feel}
                type="button"
                onClick={() => selectFeel(feel)}
                aria-pressed={selected}
                title={FEEL_LABELS[feel]}
                aria-label={FEEL_LABELS[feel]}
                className={clsx(
                  'shrink-0 whitespace-nowrap rounded-full px-1.5 py-1.5 text-xs font-medium transition',
                  selected
                    ? 'bg-degree-root text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {FEEL_SHORT[feel]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Swing intensity — reserved height; inert when the feel isn't swung. */}
      <div className={clsx('flex h-7 items-center gap-2 transition-opacity', swung ? 'opacity-100' : 'opacity-30')}>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Swing
        </span>
        <input
          type="range"
          min={SWING_MIN}
          max={SWING_MAX}
          step={0.01}
          value={swing}
          disabled={!swung}
          onChange={(e) => onSwing(Number(e.target.value))}
          aria-label="Swing intensity"
          className="metro-range w-32 disabled:cursor-not-allowed"
          style={{ '--range-fill': `${((swing - SWING_MIN) / (SWING_MAX - SWING_MIN)) * 100}%` } as CSSProperties}
        />
        <span className="w-8 font-mono text-[10px] tabular-nums text-muted-foreground">
          {Math.round(((swing - SWING_MIN) / (SWING_MAX - SWING_MIN)) * 100)}%
        </span>
      </div>
    </div>
  );
});
