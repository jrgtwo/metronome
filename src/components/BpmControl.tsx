import { memo } from 'react';
import { Hand, Minus, Plus, ChevronsUp } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useTapTempo } from '../tapTempo';

const BPM_MIN = 40;
const BPM_MAX = 240;

/** Chunky pushable stepper button, shared by the two tempo steppers. */
const stepperClass = 'h-10 w-10 shrink-0 text-foreground hover:brightness-95';

/** The hero tempo readout — sits at the center of the beat arc. `large` grows it
 *  when the deck is collapsed (pulse fills the space); `compact` shrinks it. */
export const TempoReadout = memo(function TempoReadout({
  bpm,
  compact = false,
  large = false,
  flash = false,
  trainerBars = null,
  trainerStep = 0,
}: {
  bpm: number;
  compact?: boolean;
  large?: boolean;
  /** Briefly flash the number (tempo-trainer "reached target" cue). */
  flash?: boolean;
  /** Bars until the trainer's next BPM step; `null` hides the hint (not counting). */
  trainerBars?: number | null;
  /** The trainer's step size, shown in the hint (e.g. "+5 in 3 bars"). */
  trainerStep?: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-mono font-semibold leading-none tracking-tight text-beat tabular-nums transition-[font-size] duration-300 ease-out ${
          compact ? 'text-4xl' : large ? 'text-8xl' : 'text-7xl'
        } ${flash ? 'animate-bpm-flash' : ''}`}
      >
        {bpm}
      </span>
      <span className="mt-1 font-mono text-2xs uppercase tracking-label text-muted-foreground">
        BPM
      </span>
      {trainerBars !== null && (
        <span className="mt-3 flex items-center gap-1.5 rounded-full bg-pop/10 px-3.5 py-1.5 font-mono text-lg font-semibold tabular-nums text-pop">
          <ChevronsUp className="h-5 w-5" aria-hidden />
          +{trainerStep} in {trainerBars} {trainerBars === 1 ? 'bar' : 'bars'}
        </span>
      )}
    </div>
  );
});

interface BpmControlProps {
  bpm: number;
  onChange: (bpm: number) => void;
  /** Whether the global spacebar tap is active (off while a dialog is open). */
  spacebarEnabled?: boolean;
}

/** Tempo controls below the arc: fine steppers flanking the coarse slider, plus a
 *  tap-tempo button (Space also taps). The store clamps to 40–240, so raw values
 *  are safe to pass through. */
export const BpmControl = memo(function BpmControl({
  bpm,
  onChange,
  spacebarEnabled = true,
}: BpmControlProps) {
  const step = (delta: number) => onChange(bpm + delta);
  const { tap } = useTapTempo({ onBpm: onChange, spacebarEnabled });

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-2">
      <div className="flex w-full items-center gap-3">
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

      <Button
        type="button"
        variant="3d"
        onClick={tap}
        aria-label="Tap tempo"
        title="Tap tempo — or press Space"
        className="h-auto gap-1.5 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Hand className="h-3.5 w-3.5" />
        Tap tempo
      </Button>
    </div>
  );
});
