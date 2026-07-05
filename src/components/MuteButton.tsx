import { memo } from 'react';
import clsx from 'clsx';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';

interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
}

/** Mute / unmute the click. Silences the click without stopping the transport
 *  (beats keep flashing). Sits beside the transport button. */
export const MuteButton = memo(function MuteButton({ muted, onToggle }: MuteButtonProps) {
  return (
    <Button
      type="button"
      variant="3d"
      size="icon"
      onClick={onToggle}
      aria-label={muted ? 'Unmute click' : 'Mute click'}
      aria-pressed={muted}
      className={clsx('h-12 w-12', muted ? 'text-pop' : 'text-muted-foreground hover:text-foreground')}
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </Button>
  );
});
