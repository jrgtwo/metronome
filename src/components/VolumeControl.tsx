import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
}

/** Click volume slider + mute toggle. Mute silences the click without stopping
 *  the transport (beats keep flashing). */
export function VolumeControl({ volume, muted, onVolume, onToggleMute }: VolumeControlProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute click' : 'Mute click'}
        aria-pressed={muted}
        className={clsx(
          'grid h-10 w-10 place-items-center rounded-full bg-card shadow-[0_3px_0_hsl(var(--shadow))] transition-all active:translate-y-[3px] active:shadow-none',
          muted ? 'text-degree-third' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(e) => onVolume(Number(e.target.value))}
        aria-label="Click volume"
        className="metro-range metro-range--mint w-40"
        style={{ '--range-fill': `${(muted ? 0 : volume) * 100}%` } as CSSProperties}
      />
    </div>
  );
}
