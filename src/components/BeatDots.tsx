import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
  /** Active subdivision; drives how many sub-pills sit between beats. */
  subdivision: SubdivisionId;
  /** Sub-tick within the current beat: 0 on the beat, 1..N-1 between, -1 when stopped. */
  currentSubdivisionIndex: number;
  isRunning: boolean;
  /** Centered inside the arc (the tempo readout). */
  children?: ReactNode;
}

// Geometry — pill inner ends ride the arc (the curved analogue of `items-end`),
// growing outward. Tunable.
const MAIN_LEN = 40;
const MAIN_LEN_ACCENT = 56;
const MAIN_W = 16;
const SUB_LEN = 18;
const SUB_W = 6;
const MARGIN = 8; // gap from the apex pill's tip to the top edge
const SPACING = 22; // desired arc-length between elements (px)
const MAX_SPAN = (265 * Math.PI) / 180; // don't close past this (leave a gap at the bottom)
const R_MIN = 64;
const R_MAX = 150;
const FALLBACK_WIDTH = 360; // before ResizeObserver measures (and in jsdom)

/**
 * The visual centerpiece — beats laid on a single arc that curves over the top of
 * the tempo counter. Main beats are the original pills (accents taller + amber,
 * regular cream); subdivisions are small pills. Each pill is rotated to point
 * outward, its inner end on the arc. Few beats → a shallow curve; more beats /
 * subdivisions → the arc opens wider (and compresses) so it always stays on-screen.
 * Active state is driven straight off the engine's `currentBeat` /
 * `currentSubdivisionIndex`, in lockstep with the audible click. `children` (the
 * tempo readout) sit at the arc's center.
 */
export function BeatDots({
  beats,
  accents,
  accentEnabled,
  currentBeat,
  subdivision,
  currentSubdivisionIndex,
  isRunning,
  children,
}: BeatDotsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setMeasured(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => setMeasured(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = measured || FALLBACK_WIDTH;

  // subdivisionCount: off=1, 8ths=2, triplets=3, 16ths=4, sextuplets=6.
  const subsPerBeat = subdivisionCount(subdivision);

  // Flatten beats + their subdivisions into evenly-spaced positions along the arc.
  type Item = { sub: boolean; accent: boolean; on: boolean };
  const items: Item[] = [];
  for (let b = 0; b < beats; b++) {
    items.push({
      sub: false,
      accent: accentEnabled && accents.includes(b),
      on: isRunning && currentBeat === b,
    });
    for (let s = 1; s < subsPerBeat; s++) {
      items.push({
        sub: true,
        accent: false,
        on: isRunning && currentBeat === b && currentSubdivisionIndex === s,
      });
    }
  }

  const n = items.length;
  const R = Math.max(R_MIN, Math.min(R_MAX, width / 2 - MAIN_LEN_ACCENT - MARGIN));
  const cx = width / 2;
  const cy = MARGIN + R + MAIN_LEN_ACCENT;

  let step = n > 1 ? SPACING / R : 0;
  if ((n - 1) * step > MAX_SPAN) step = MAX_SPAN / (n - 1); // compress to fit the span
  const k = n > 1 ? Math.max(0.4, Math.min(1, (step * R) / SPACING)) : 1; // shrink pills when dense
  const span = (n - 1) * step;
  const start = -Math.PI / 2 - span / 2; // centered on the top
  const height = cy + 64; // reserve room below center for the readout

  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{ height }}
      role="img"
      aria-label={`${beats} beats per measure`}
    >
      {items.map((it, i) => {
        const a = start + i * step;
        const len = (it.sub ? SUB_LEN : it.accent ? MAIN_LEN_ACCENT : MAIN_LEN) * k;
        const w = (it.sub ? SUB_W : MAIN_W) * k;
        const rad = R + len / 2; // inner end on the arc, grows outward
        const x = cx + rad * Math.cos(a);
        const y = cy + rad * Math.sin(a);
        const rot = (a * 180) / Math.PI + 90; // long axis radial
        return (
          <div
            key={i}
            className="pointer-events-none absolute"
            style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg)` }}
          >
            <div
              data-testid={it.sub ? 'sub-dot' : 'main-dot'}
              className={clsx(
                'rounded-full transition-[background-color,box-shadow] duration-100',
                it.on && 'animate-beat-pop',
                it.sub
                  ? it.on
                    ? 'bg-beat shadow-glow-beat-sm'
                    : 'bg-beat/15'
                  : it.on
                    ? it.accent
                      ? 'bg-primary shadow-glow-primary'
                      : 'bg-beat shadow-glow-beat'
                    : it.accent
                      ? 'bg-primary/25'
                      : 'bg-beat/15',
              )}
              style={{ width: w, height: len }}
            />
          </div>
        );
      })}

      <div
        className="absolute"
        style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}
      >
        {children}
      </div>
    </div>
  );
}
