import { useEffect, useRef } from 'react';
import type { SubdivisionId } from '@fretwork/lib';

/** The metronome settings we persist across reloads (transport is excluded). */
export interface PersistedSettings {
  bpm: number;
  timeSignatureId: string;
  subdivision: SubdivisionId;
  swing: number;
  volume: number;
  clickMuted: boolean;
}

/** Bump when the blob's shape changes incompatibly; `parseSettings` stays
 *  best-effort per field, so additive changes don't need a bump. */
export const SETTINGS_VERSION = 1;

/** Serialize settings to the stored JSON blob (version-stamped). */
export function serializeSettings(s: PersistedSettings): string {
  return JSON.stringify({ v: SETTINGS_VERSION, ...s });
}

// Follows the same `metronomnom.<feature>` key convention as src/theme.ts.
const STORAGE_KEY = 'metronomnom.settings';

/** Read + validate the persisted settings; `{}` if unavailable/empty/corrupt. */
export function readStoredSettings(): Partial<PersistedSettings> {
  try {
    return parseSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    // localStorage may be unavailable (private mode) — fall back to defaults.
    return {};
  }
}

/** Persist settings, silently ignoring write failures (e.g. private mode). */
export function writeSettings(s: PersistedSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeSettings(s));
  } catch {
    // Ignore — persistence is best-effort.
  }
}

/** A slider drag fires many updates; wait for it to settle before writing once. */
const SAVE_DEBOUNCE_MS = 300;

/**
 * The slice of `useMetronome()`'s return that persistence reads + writes. The
 * full hook return is a structural superset, so `MetronomeApp` passes `m` directly.
 */
export interface MetronomeSettingsPort {
  bpm: number;
  timeSignature: { readonly id: string };
  subdivision: SubdivisionId;
  swing: number;
  volume: number;
  clickMuted: boolean;
  setBpm: (bpm: number) => void;
  setTimeSignature: (id: string) => void;
  setSubdivision: (id: SubdivisionId) => void;
  setSwing: (swing: number) => void;
  setVolume: (v: number) => void;
  setClickMuted: (muted: boolean) => void;
}

/**
 * Restores persisted settings on mount (via the setters) and saves them,
 * debounced, whenever they change. Transport is never persisted. Setters clamp
 * out-of-range values, so restore is safe even for a hand-edited blob.
 */
export function usePersistSettings(m: MetronomeSettingsPort): void {
  const restored = useRef(false);

  // Restore once, before the save effect is allowed to write.
  useEffect(() => {
    const s = readStoredSettings();
    // setTimeSignature clears accents as a side effect — apply it first so a
    // future accents restore (when accent editing lands) isn't wiped.
    if (s.timeSignatureId !== undefined) m.setTimeSignature(s.timeSignatureId);
    if (s.bpm !== undefined) m.setBpm(s.bpm);
    if (s.subdivision !== undefined) m.setSubdivision(s.subdivision);
    if (s.swing !== undefined) m.setSwing(s.swing);
    if (s.volume !== undefined) m.setVolume(s.volume);
    if (s.clickMuted !== undefined) m.setClickMuted(s.clickMuted);
    restored.current = true;
    // Run exactly once on mount; the setters are stable store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save on any change (skipped until the initial restore is done).
  useEffect(() => {
    if (!restored.current) return;
    const id = setTimeout(() => {
      writeSettings({
        bpm: m.bpm,
        timeSignatureId: m.timeSignature.id,
        subdivision: m.subdivision,
        swing: m.swing,
        volume: m.volume,
        clickMuted: m.clickMuted,
      });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [m.bpm, m.timeSignature.id, m.subdivision, m.swing, m.volume, m.clickMuted]);
}

const SUBDIVISIONS: readonly string[] = ['off', '8ths', 'triplets', '16ths', 'sextuplets'];

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Parse a stored settings blob into a partial of only the fields that pass
 * validation — any missing/corrupt/wrong-typed field is dropped so a bad blob
 * degrades to defaults rather than crashing. Ranges are left to the setters,
 * which clamp (bpm 40–240, volume 0–1, swing 0.5–0.95).
 */
export function parseSettings(raw: string | null): Partial<PersistedSettings> {
  if (!raw) return {};
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof obj !== 'object' || obj === null) return {};
  const o = obj as Record<string, unknown>;
  const out: Partial<PersistedSettings> = {};
  if (isFiniteNumber(o.bpm)) out.bpm = o.bpm;
  if (typeof o.timeSignatureId === 'string' && o.timeSignatureId) out.timeSignatureId = o.timeSignatureId;
  if (typeof o.subdivision === 'string' && SUBDIVISIONS.includes(o.subdivision)) {
    out.subdivision = o.subdivision as SubdivisionId;
  }
  if (isFiniteNumber(o.swing)) out.swing = o.swing;
  if (isFiniteNumber(o.volume)) out.volume = o.volume;
  if (typeof o.clickMuted === 'boolean') out.clickMuted = o.clickMuted;
  return out;
}
