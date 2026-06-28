import { memo } from 'react';
import { TIME_SIGNATURES } from '@fretwork/lib';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

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
      <span className="font-mono text-2xs uppercase tracking-label text-muted-foreground">
        Meter
      </span>
      {/* One centered line, sized to fit a phone without scrolling. */}
      <div className="flex w-full justify-center">
        <ToggleGroup
          type="single"
          value={value}
          // Radix single-select allows deselect (→ ''); keep one always selected.
          onValueChange={(v) => {
            if (v) onChange(v);
          }}
          className="flex max-w-full flex-nowrap gap-0.5 rounded-full bg-card p-1 shadow-btn"
        >
          {TIME_SIGNATURES.map((ts) => (
            <ToggleGroupItem
              key={ts.id}
              value={ts.id}
              className="shrink-0 whitespace-nowrap rounded-full px-1.5 py-1.5 font-mono text-xs font-normal tabular-nums text-muted-foreground hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {ts.id}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
});
