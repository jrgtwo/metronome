import { memo } from 'react';
import clsx from 'clsx';
import { TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

interface TrainerButtonProps {
  active: boolean;
  onToggle: () => void;
}

/** Enter / exit tempo-trainer mode. Sits beside the transport (mute + play):
 *  flipping it on reveals the trainer bar and, while playing, ramps the tempo up
 *  toward the target. */
export const TrainerButton = memo(function TrainerButton({ active, onToggle }: TrainerButtonProps) {
  return (
    <Button
      type="button"
      variant="3d"
      size="icon"
      onClick={onToggle}
      aria-label={active ? 'Exit tempo trainer' : 'Enter tempo trainer'}
      aria-pressed={active}
      className={clsx('h-12 w-12', active ? 'text-pop' : 'text-muted-foreground hover:text-foreground')}
    >
      <TrendingUp className="h-5 w-5" />
    </Button>
  );
});
