import { useEffect } from 'react';
import { Bluetooth, X, RotateCcw, Minus, Plus } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCalibration } from './useCalibration';

interface CalibrationSheetProps {
  open: boolean;
  onClose: () => void;
}

function ms(n: number): string {
  return `${Math.round(n)} ms`;
}

/**
 * Calibration sheet: shows the latency picture (native / browser / saved offset
 * / effective) and offers two ways to fix it — apply the native value when a
 * Tauri shell supplies one, or the manual tap-in for the web fallback.
 */
export function CalibrationSheet({ open, onClose }: CalibrationSheetProps) {
  const cal = useCalibration();

  // Let the spacebar register taps during a tap-in session.
  useEffect(() => {
    if (!open || !cal.tapRunning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        cal.registerTap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, cal.tapRunning, cal]);

  return (
    // shadcn Dialog gives focus-trap, Escape, and backdrop-click-to-close for free
    // (replacing the old hand-rolled overlay + its a11y eslint-disables). It renders
    // as a bottom sheet on mobile and centered on sm+ via position="sheet".
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent position="sheet">
        <div className="mb-4 flex items-center justify-between">
          <DialogTitle className="font-mono text-sm font-normal uppercase leading-normal tracking-label-sm text-beat">
            Calibration
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-beat"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          Compensate for audio output latency so beats land on time.
        </DialogDescription>

        {/* Device */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          {cal.isBluetooth && <Bluetooth className="h-4 w-4 text-info" />}
          {cal.deviceLabel ? (
            <span className="text-beat">{cal.deviceLabel}</span>
          ) : (
            <button
              type="button"
              onClick={() => void cal.grantLabelPermission()}
              className="text-primary hover:underline"
            >
              Enable device names
            </button>
          )}
        </div>

        {/* Latency readouts */}
        <dl className="mb-4 space-y-1.5 rounded-lg bg-background/60 p-3 font-mono text-xs">
          <Row label="Native (OS)" value={cal.nativeLatencyMs == null ? 'unavailable' : ms(cal.nativeLatencyMs)} />
          <Row label="Browser" value={ms(cal.browserLatencyMs)} />
          <Row label="Saved offset" value={ms(cal.offsetMs)} />
          <Row label="Effective" value={ms(cal.effectiveLatencyMs)} accent />
        </dl>

        {/* Native apply (Tauri only) */}
        {cal.nativeLatencyMs != null ? (
          <button
            type="button"
            onClick={cal.applyNative}
            className="mb-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
          >
            Use native latency ({ms(cal.nativeLatencyMs)})
          </button>
        ) : (
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            The browser can’t read true Bluetooth output latency. Tap along below to measure it, or
            adjust the offset by hand. A native build reports it automatically.
          </p>
        )}

        {/* Tap-in */}
        <div className="mb-4 rounded-lg border border-border p-3">
          {!cal.tapRunning ? (
            <button
              type="button"
              onClick={() => void cal.startTapIn()}
              className="w-full rounded-md bg-secondary py-2 text-sm text-beat hover:bg-secondary/80"
            >
              Start tap-in
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={cal.registerTap}
                className="grid h-24 w-full place-items-center rounded-md bg-primary/20 text-sm text-beat active:bg-primary/40"
              >
                Tap with the click — or press Space
              </button>
              <div className="flex w-full items-center justify-between font-mono text-xs text-muted-foreground">
                <span>{cal.tapCount} taps</span>
                <span>{cal.tapMeasuredMs == null ? 'measuring…' : `≈ ${ms(cal.tapMeasuredMs)}`}</span>
              </div>
              <div className="flex w-full gap-2">
                <button
                  type="button"
                  onClick={cal.cancelTapIn}
                  className="flex-1 rounded-md bg-secondary py-1.5 text-xs text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={cal.finishTapIn}
                  disabled={cal.tapMeasuredMs == null}
                  className="flex-1 rounded-md bg-primary py-1.5 text-xs text-primary-foreground disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual offset + reset */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs uppercase tracking-wider text-muted-foreground">
              Offset
            </span>
            <button
              type="button"
              aria-label="Decrease offset"
              onClick={() => cal.setOffset(cal.offsetMs - 5)}
              className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-beat"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-14 text-center font-mono text-sm tabular-nums text-beat">
              {ms(cal.offsetMs)}
            </span>
            <button
              type="button"
              aria-label="Increase offset"
              onClick={() => cal.setOffset(cal.offsetMs + 5)}
              className="grid h-7 w-7 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-beat"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={cal.reset}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-beat"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? 'text-primary' : 'text-beat'}>{value}</dd>
    </div>
  );
}
