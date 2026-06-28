import { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

const BPM_MIN = 40;
const BPM_MAX = 240;

/** Chunky pushable stepper button, shared by the two tempo steppers. */
const stepperClass = 'h-10 w-10 shrink-0 text-foreground hover:brightness-95';

/** The hero tempo readout — sits at the center of the beat arc. `compact`
 *  shrinks it when the metronome mascot is enlarged. */
export const TempoReadout = memo(function TempoReadout({
  bpm,
  compact = false,
}: {
  bpm: number;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-mono font-semibold leading-none tracking-tight text-beat tabular-nums transition-[font-size] duration-300 ease-out ${
          compact ? 'text-4xl' : 'text-7xl'
        }`}
      >
        {bpm}
      </span>
      <span className="mt-1 font-mono text-2xs uppercase tracking-label text-muted-foreground">
        BPM
      </span>
    </div>
  );
});

interface BpmControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
}

/** Tempo controls below the arc: fine steppers flanking the coarse slider. The
 *  store clamps to 40–240, so raw values are safe to pass through. */
export const BpmControl = memo(function BpmControl({ bpm, onChange }: BpmControlProps) {
  const step = (delta: number) => onChange(bpm + delta);

  return (
    <div className="flex w-full max-w-xs items-center gap-3">
      <Button
        type="button"
        variant="3d"
        size="icon"
        aria-label="Decrease tempo"
        onClick={() => step(-1)}
        className={stepperClass}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Slider
        min={BPM_MIN}
        max={BPM_MAX}
        value={[bpm]}
        onValueChange={([v]) => onChange(v)}
        aria-label="Tempo"
        className="flex-1"
      />

      <Button
        type="button"
        variant="3d"
        size="icon"
        aria-label="Increase tempo"
        onClick={() => step(1)}
        className={stepperClass}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
});
