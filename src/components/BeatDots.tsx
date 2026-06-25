import clsx from 'clsx';
import { subdivisionCount } from '@fretwork/lib';
import type { SubdivisionId } from '@fretwork/lib';

interface BeatDotsProps {
  beats: number;
  /** Beat indices that are accented (downbeats of the meter). */
  accents: readonly number[];
  accentEnabled: boolean;
  /** Current beat index, 0-based; -1 when stopped. */
  currentBeat: number;
  /** Active subdivision; drives how many sub-dots sit between beats. */
  subdivision: SubdivisionId;
  /** Sub-tick within the current beat: 0 on the beat, 1..N-1 between, -1 when stopped. */
  currentSubdivisionIndex: number;
  isRunning: boolean;
}

/**
 * The visual centerpiece — one tall pill per beat in the measure, plus tiny
 * round sub-dots between them when a subdivision is active. The active pill
 * lights up (accents taller + amber, regular beats cream); the lit sub-dot
 * moves across the beat as `currentSubdivisionIndex` advances. Stopped =
 * everything dim. Driven straight off the engine's `currentBeat` /
 * `currentSubdivisionIndex`, so it stays in lockstep with the audible click.
 */
export function BeatDots({
  beats,
  accents,
  accentEnabled,
  currentBeat,
  subdivision,
  currentSubdivisionIndex,
  isRunning,
}: BeatDotsProps) {
  // subdivisionCount: off=1, 8ths=2, triplets=3, 16ths=4, sextuplets=6.
  // N-1 sub-dots sit after each beat's pill (the last beat's trailing dot is
  // the musical "&" before the measure loops).
  const subsPerBeat = subdivisionCount(subdivision);
  const hasSubs = subsPerBeat > 1;

  return (
    <div
      className={clsx('flex items-end justify-center', hasSubs ? 'gap-1.5 sm:gap-2' : 'gap-2 sm:gap-3')}
      role="img"
      aria-label={`${beats} beats per measure`}
    >
      {Array.from({ length: beats }, (_, i) => {
        const isAccent = accentEnabled && accents.includes(i);
        const isActive = isRunning && currentBeat === i;
        return (
          <div key={i} className="flex items-end gap-1 sm:gap-1.5">
            <div
              className={clsx(
                'rounded-full transition-[background-color,box-shadow,opacity] duration-100',
                isAccent ? 'h-14 w-4 sm:h-16 sm:w-5' : 'h-10 w-4 sm:h-12 sm:w-5',
                isActive && 'animate-beat-pop',
                isActive
                  ? isAccent
                    ? 'bg-degree-root shadow-[0_0_22px_-2px_hsl(var(--degree-root))]'
                    : 'bg-pearl shadow-[0_0_18px_-4px_hsl(var(--pearl))]'
                  : isAccent
                    ? 'bg-degree-root/25'
                    : 'bg-pearl/15',
              )}
            />
            {hasSubs &&
              Array.from({ length: subsPerBeat - 1 }, (_, k) => k + 1).map((subIdx) => {
                const subActive =
                  isRunning && currentBeat === i && currentSubdivisionIndex === subIdx;
                return (
                  <div
                    key={subIdx}
                    data-testid="sub-dot"
                    className={clsx(
                      'h-1.5 w-1.5 rounded-full transition-[background-color,box-shadow,opacity] duration-100',
                      subActive
                        ? 'animate-beat-pop bg-pearl shadow-[0_0_10px_-3px_hsl(var(--pearl))]'
                        : 'bg-pearl/15',
                    )}
                  />
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
