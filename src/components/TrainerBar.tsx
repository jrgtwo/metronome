import { memo } from 'react';
import clsx from 'clsx';
import { Minus, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface TrainerBarProps {
  target: number;
  step: number;
  interval: number;
  onTarget: (n: number) => void;
  onStep: (n: number) => void;
  onInterval: (n: number) => void;
  /** True briefly after the ramp reaches its target — highlights the bar. */
  justReached: boolean;
}

/** Chunky pushable mini-stepper, shared by the three trainer steppers. */
const stepperClass = 'h-8 w-8 shrink-0 text-foreground hover:brightness-95';

/** A labelled −/value/+ stepper. The hook clamps, so raw value±1 is safe to pass. */
const Stepper = memo(function Stepper({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-2xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="3d"
          size="icon"
          aria-label={`Decrease ${unit}`}
          onClick={() => onChange(value - 1)}
          className={stepperClass}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center font-mono text-sm tabular-nums text-foreground">{value}</span>
        <Button
          type="button"
          variant="3d"
          size="icon"
          aria-label={`Increase ${unit}`}
          onClick={() => onChange(value + 1)}
          className={stepperClass}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});

/**
 * The tempo-trainer bar — appears between the transport and the control deck while
 * trainer mode is on (entered/exited by the transport-side `TrainerButton`). Holds
 * the Target / Step / Bars steppers; while playing, the app ramps BPM up by `step`
 * every `interval` bars until it reaches `target`, then holds. Purely presentational
 * — all state + the bar-driven stepping live in `useTempoTrainer`.
 */
export const TrainerBar = memo(function TrainerBar({
  target,
  step,
  interval,
  onTarget,
  onStep,
  onInterval,
  justReached,
}: TrainerBarProps) {
  return (
    <div
      className={clsx(
        'mx-auto flex items-center justify-center gap-x-4 rounded-xl border border-border bg-card px-4 py-2 transition-[background-color,box-shadow] duration-300',
        justReached && 'bg-pop/10 ring-2 ring-pop',
      )}
    >
      <span className="font-mono text-2xs uppercase tracking-label text-muted-foreground">Trainer</span>
      <Stepper label="Target" unit="target tempo" value={target} onChange={onTarget} />
      <Stepper label="Step" unit="step size" value={step} onChange={onStep} />
      <Stepper label="Bars" unit="bar interval" value={interval} onChange={onInterval} />
    </div>
  );
});
