import type { CSSProperties } from 'react';
import { Minus, Plus } from 'lucide-react';

const BPM_MIN = 40;
const BPM_MAX = 240;

/** Chunky pushable stepper button, shared by the two tempo steppers. */
const stepperClass =
  'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-foreground shadow-[0_3px_0_hsl(var(--shadow))] transition-all hover:brightness-95 active:translate-y-[3px] active:shadow-none';

/** The hero tempo readout — sits at the center of the beat arc. `compact`
 *  shrinks it when the metronome mascot is enlarged. */
export function TempoReadout({ bpm, compact = false }: { bpm: number; compact?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-mono font-semibold leading-none tracking-tight text-pearl tabular-nums transition-[font-size] duration-300 ease-out ${
          compact ? 'text-4xl' : 'text-7xl'
        }`}
      >
        {bpm}
      </span>
      <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        BPM
      </span>
    </div>
  );
}

interface BpmControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
}

/** Tempo controls below the arc: fine steppers flanking the coarse slider. The
 *  store clamps to 40–240, so raw values are safe to pass through. */
export function BpmControl({ bpm, onChange }: BpmControlProps) {
  const step = (delta: number) => onChange(bpm + delta);
  const fill = ((bpm - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100;

  return (
    <div className="flex w-full max-w-xs items-center gap-3">
      <button type="button" aria-label="Decrease tempo" onClick={() => step(-1)} className={stepperClass}>
        <Minus className="h-4 w-4" />
      </button>

      <input
        type="range"
        min={BPM_MIN}
        max={BPM_MAX}
        value={bpm}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Tempo"
        className="metro-range flex-1"
        style={{ '--range-fill': `${fill}%` } as CSSProperties}
      />

      <button type="button" aria-label="Increase tempo" onClick={() => step(1)} className={stepperClass}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
