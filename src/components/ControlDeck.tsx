import { memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SubdivisionId } from '@fretwork/lib';
import { BpmControl } from './BpmControl';
import { TimeSignaturePicker } from './TimeSignaturePicker';
import { FeelControl } from './FeelControl';

interface ControlDeckProps {
  expanded: boolean;
  onToggle: () => void;
  // Tempo (always visible)
  bpm: number;
  onBpm: (bpm: number) => void;
  spacebarEnabled: boolean;
  // Meter + Feel (revealed when expanded)
  timeSignatureId: string;
  onTimeSignature: (id: string) => void;
  subdivision: SubdivisionId;
  swing: number;
  onSubdivision: (id: SubdivisionId) => void;
  onSwing: (swing: number) => void;
}

/**
 * The docked control deck: a single grounded surface at the bottom of the screen,
 * quieter than the pulse above. Tempo is always shown; a grab handle expands the
 * deck to reveal meter, feel, and swing. Reuses the existing control components.
 */
export const ControlDeck = memo(function ControlDeck({
  expanded,
  onToggle,
  bpm,
  onBpm,
  spacebarEnabled,
  timeSignatureId,
  onTimeSignature,
  subdivision,
  swing,
  onSubdivision,
  onSwing,
}: ControlDeckProps) {
  return (
    // -mx-5 bleeds the deck to the container edges. It stays the page color (so the
    // bg-card controls on it keep their contrast, like the header buttons); the
    // rounded top + top border + upward shadow are what read it as a lifted surface.
    <section className="-mx-5 rounded-t-2xl border-t border-border bg-background px-5 pb-6 pt-1 shadow-deck">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Hide meter, feel, and swing' : 'Show meter, feel, and swing'}
        className="mx-auto flex w-full flex-col items-center gap-1 rounded-xl py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="h-1 w-9 rounded-full bg-border" />
        <span className="flex items-center gap-1 font-mono text-2xs uppercase tracking-label text-muted-foreground">
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3" /> Less
            </>
          ) : (
            <>
              <ChevronUp className="h-3 w-3" /> More
            </>
          )}
        </span>
      </button>

      <div className="flex flex-col items-center pt-1">
        <BpmControl bpm={bpm} onChange={onBpm} spacebarEnabled={spacebarEnabled} />

        {/* Collapsible meter/feel/swing. The grid-rows 0fr↔1fr trick animates
            height smoothly without measuring or a hard-coded max-height; the inner
            overflow-hidden clips it while collapsed. */}
        <div
          className={`grid w-full transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-col items-center gap-4 pt-4">
              <div className="h-px w-full bg-border" />
              <TimeSignaturePicker value={timeSignatureId} onChange={onTimeSignature} />
              <FeelControl
                subdivision={subdivision}
                swing={swing}
                onSubdivision={onSubdivision}
                onSwing={onSwing}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
