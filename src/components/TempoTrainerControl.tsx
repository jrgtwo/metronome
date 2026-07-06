import { memo } from 'react';
import clsx from 'clsx';
import { Power, Minus, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface TempoTrainerControlProps {
  enabled: boolean;
  target: number;
  step: number;
  interval: number;
  onToggle: () => void;
  onTarget: (n: number) => void;
  onStep: (n: number) => void;
  onInterval: (n: number) => void;
  /** True briefly after the ramp reaches its target — highlights the row. */
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
 * The tempo-trainer row in the expanded control deck: an arm toggle plus Target /
 * Step / Bars steppers. When armed and playing, the app ramps BPM up by `step`
 * every `interval` bars until it reaches `target`. Purely presentational — all
 * state + the bar-driven stepping live in `useTempoTrainer`.
 */
export const TempoTrainerControl = memo(function TempoTrainerControl({
  enabled,
  target,
  step,
  interval,
  onToggle,
  onTarget,
  onStep,
  onInterval,
  justReached,
}: TempoTrainerControlProps) {
  return (
    <div
      className={clsx(
        'flex w-full flex-col items-center gap-2 rounded-xl px-2 py-1 transition-[background-color,box-shadow] duration-300',
        justReached && 'bg-pop/10 ring-2 ring-pop',
      )}
    >
      <span className="font-mono text-2xs uppercase tracking-label text-muted-foreground">
        Tempo trainer
      </span>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <Button
          type="button"
          variant="3d"
          size="icon"
          onClick={onToggle}
          aria-label={enabled ? 'Disable tempo trainer' : 'Enable tempo trainer'}
          aria-pressed={enabled}
          className={clsx('h-10 w-10', enabled ? 'text-pop' : 'text-muted-foreground hover:text-foreground')}
        >
          <Power className="h-4 w-4" />
        </Button>
        <Stepper label="Target" unit="target tempo" value={target} onChange={onTarget} />
        <Stepper label="Step" unit="step size" value={step} onChange={onStep} />
        <Stepper label="Bars" unit="bar interval" value={interval} onChange={onInterval} />
      </div>
    </div>
  );
});
