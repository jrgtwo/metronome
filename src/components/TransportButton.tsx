import { memo } from 'react';
import clsx from 'clsx';
import { Play, Square } from 'lucide-react';
import { Button } from './ui/button';

interface TransportButtonProps {
  isRunning: boolean;
  onToggle: () => void;
}

/** Big primary start/stop control. `onToggle` calls the engine's `toggle()`,
 *  which unlocks the AudioContext on the first gesture. */
export const TransportButton = memo(function TransportButton({ isRunning, onToggle }: TransportButtonProps) {
  return (
    <Button
      type="button"
      variant="transport"
      onClick={onToggle}
      aria-label={isRunning ? 'Stop' : 'Start'}
      aria-pressed={isRunning}
      className={clsx(
        'h-20 w-20',
        isRunning
          ? 'bg-secondary text-beat shadow-transport hover:bg-secondary/80 active:shadow-none'
          : 'bg-pop text-pop-foreground shadow-transport-play hover:brightness-105 active:shadow-transport-play-active',
      )}
    >
      {isRunning ? (
        <Square className="h-7 w-7" fill="currentColor" strokeWidth={0} />
      ) : (
        <Play className="ml-1 h-8 w-8" fill="currentColor" strokeWidth={0} />
      )}
    </Button>
  );
});
