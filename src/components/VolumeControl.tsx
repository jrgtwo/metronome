import { memo } from 'react';
import clsx from 'clsx';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface VolumeControlProps {
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
}

/** Click volume slider + mute toggle. Mute silences the click without stopping
 *  the transport (beats keep flashing). */
export const VolumeControl = memo(function VolumeControl({
  volume,
  muted,
  onVolume,
  onToggleMute,
}: VolumeControlProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="3d"
        size="icon"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute click' : 'Mute click'}
        aria-pressed={muted}
        className={clsx('h-10 w-10', muted ? 'text-pop' : 'text-muted-foreground hover:text-foreground')}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={[muted ? 0 : volume]}
        onValueChange={([v]) => onVolume(v)}
        aria-label="Click volume"
        className="w-40 [--range-color:var(--mint)]"
      />
    </div>
  );
});
