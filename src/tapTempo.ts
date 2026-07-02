import { useCallback, useEffect, useRef } from 'react';

/** Idle gap (ms) after which the next tap starts a fresh sequence. */
export const TAP_RESET_MS = 2000;
/** How many recent taps feed the median (a rolling window). */
export const TAP_WINDOW = 6;

/**
 * Record a tap at `now`: start over if the previous tap is older than the reset
 * window, otherwise append; keep only the last `TAP_WINDOW` taps.
 */
export function pushTap(times: readonly number[], now: number): number[] {
  const last = times[times.length - 1];
  if (last !== undefined && now - last > TAP_RESET_MS) return [now];
  return [...times, now].slice(-TAP_WINDOW);
}

/**
 * Tap tempo. `bpmFromTaps` turns a series of tap timestamps (ms) into a BPM from
 * the median inter-tap interval (median resists one stray/late tap better than a mean).
 */
export function bpmFromTaps(times: readonly number[]): number | null {
  if (times.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < times.length; i++) intervals.push(times[i] - times[i - 1]);
  const sorted = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(60000 / median);
}

/** Focused buttons/inputs handle Space themselves — don't also global-tap (and don't
 *  swallow their activation). */
function isInteractive(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'BUTTON' ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    tag === 'A' ||
    (el as HTMLElement).isContentEditable
  );
}

interface UseTapTempoOptions {
  /** Called with the derived BPM on the 2nd+ tap of a sequence. */
  onBpm: (bpm: number) => void;
  /** When true, Space also taps (gated off while a dialog is open). Default true. */
  spacebarEnabled?: boolean;
}

/**
 * Tap-tempo controller: returns `tap()` for a button, and (when enabled) wires a
 * gated global Space handler. Timestamps live in a ref via `performance.now()`.
 */
export function useTapTempo({ onBpm, spacebarEnabled = true }: UseTapTempoOptions): { tap: () => void } {
  const times = useRef<number[]>([]);
  const onBpmRef = useRef(onBpm);
  onBpmRef.current = onBpm; // always call the latest without re-subscribing the listener

  const tap = useCallback(() => {
    const next = pushTap(times.current, performance.now());
    times.current = next;
    const bpm = bpmFromTaps(next);
    if (bpm !== null) onBpmRef.current(bpm);
  }, []);

  useEffect(() => {
    if (!spacebarEnabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      if (isInteractive(document.activeElement)) return;
      e.preventDefault(); // stop the page from scrolling
      tap();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spacebarEnabled, tap]);

  return { tap };
}
