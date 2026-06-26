import clsx from 'clsx';
import { Play, Square } from 'lucide-react';

interface TransportButtonProps {
  isRunning: boolean;
  onToggle: () => void;
}

/** Big primary start/stop control. `onToggle` calls the engine's `toggle()`,
 *  which unlocks the AudioContext on the first gesture. */
export function TransportButton({ isRunning, onToggle }: TransportButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isRunning ? 'Stop' : 'Start'}
      aria-pressed={isRunning}
      className={clsx(
        'grid h-20 w-20 place-items-center rounded-full transition-all duration-75',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isRunning
          ? 'bg-secondary text-pearl shadow-[0_5px_0_hsl(var(--shadow))] hover:bg-secondary/80 active:translate-y-[5px] active:shadow-none'
          : 'bg-degree-third text-white shadow-[0_6px_0_hsl(var(--primary-foreground))] hover:brightness-105 active:translate-y-[5px] active:shadow-[0_1px_0_hsl(var(--primary-foreground))]',
      )}
    >
      {isRunning ? (
        <Square className="h-7 w-7" fill="currentColor" strokeWidth={0} />
      ) : (
        <Play className="ml-1 h-8 w-8" fill="currentColor" strokeWidth={0} />
      )}
    </button>
  );
}
