import { memo } from 'react';
import clsx from 'clsx';
import { TIME_SIGNATURES } from '@fretwork/lib';

interface TimeSignaturePickerProps {
  value: string;
  onChange: (id: string) => void;
}

/** Segmented selector over the lib's `TIME_SIGNATURES`. */
export const TimeSignaturePicker = memo(function TimeSignaturePicker({
  value,
  onChange,
}: TimeSignaturePickerProps) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Meter
      </span>
      {/* One centered line, sized to fit a phone without scrolling. */}
      <div className="flex w-full justify-center">
        <div className="flex max-w-full flex-nowrap gap-0.5 rounded-full bg-card p-1 shadow-[0_3px_0_hsl(var(--shadow))]">
          {TIME_SIGNATURES.map((ts) => {
            const selected = ts.id === value;
            return (
              <button
                key={ts.id}
                type="button"
                onClick={() => onChange(ts.id)}
                aria-pressed={selected}
                className={clsx(
                  'shrink-0 whitespace-nowrap rounded-full px-1.5 py-1.5 font-mono text-xs tabular-nums transition',
                  selected
                    ? 'bg-degree-root text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {ts.id}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
