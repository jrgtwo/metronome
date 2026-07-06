import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tempo trainer (FT-7): while armed and playing, raise BPM by `step` every
 * `interval` bars until it reaches `target`, then hold at target and disarm.
 *
 * The pure helpers below carry the ramp math + persistence so they unit-test
 * without the audio engine (same split as `settings.ts` / `tapTempo.ts`). The
 * `useTempoTrainer` hook owns arm state, the bar-driven stepper, and the
 * disarm-on-manual-override choke point.
 */

export interface TrainerConfig {
  target: number;
  step: number;
  interval: number;
}

/** Config that also persists to the URL (config) + localStorage (config + enabled). */
export const TRAINER_DEFAULTS: TrainerConfig = { target: 140, step: 5, interval: 4 };

/** Bump when the stored blob's shape changes incompatibly (parse is best-effort per field). */
export const TRAINER_VERSION = 1;

const TARGET_MIN = 40; // matches the engine/store BPM clamp
const TARGET_MAX = 240;
const STEP_MIN = 1;
const STEP_MAX = 30;
const INTERVAL_MIN = 1;
const INTERVAL_MAX = 16;

const clampInt = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

export const clampTarget = (n: number): number => clampInt(n, TARGET_MIN, TARGET_MAX);
export const clampStep = (n: number): number => clampInt(n, STEP_MIN, STEP_MAX);
export const clampInterval = (n: number): number => clampInt(n, INTERVAL_MIN, INTERVAL_MAX);

/** The next BPM one step up, never past the target (so it holds at the goal). */
export function nextTrainerBpm(current: number, step: number, target: number): number {
  return Math.min(current + step, target);
}

/** Whether the ramp has reached (or passed) its target. */
export function reachedTarget(current: number, target: number): boolean {
  return current >= target;
}

export interface PersistedTrainer extends TrainerConfig {
  enabled: boolean;
}

// Same `metronomnom.<feature>` key convention as theme/settings.
const STORAGE_KEY = 'metronomnom.trainer';

/** Serialize the trainer state to the stored JSON blob (version-stamped). */
export function serializeTrainer(s: PersistedTrainer): string {
  return JSON.stringify({ v: TRAINER_VERSION, ...s });
}

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Parse a stored trainer blob into a partial of only the fields that pass
 * validation; anything missing/corrupt/wrong-typed is dropped so a bad blob
 * degrades to defaults. Ranges are left to the hook, which clamps.
 */
export function parseTrainer(raw: string | null): Partial<PersistedTrainer> {
  if (!raw) return {};
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof obj !== 'object' || obj === null) return {};
  const o = obj as Record<string, unknown>;
  const out: Partial<PersistedTrainer> = {};
  if (isFiniteNumber(o.target)) out.target = o.target;
  if (isFiniteNumber(o.step)) out.step = o.step;
  if (isFiniteNumber(o.interval)) out.interval = o.interval;
  if (typeof o.enabled === 'boolean') out.enabled = o.enabled;
  return out;
}

/** Read + validate the persisted trainer state; `{}` if unavailable/empty/corrupt. */
export function readStoredTrainer(): Partial<PersistedTrainer> {
  try {
    return parseTrainer(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
}

/** Persist trainer state, silently ignoring write failures (e.g. private mode). */
export function writeTrainer(s: PersistedTrainer): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeTrainer(s));
  } catch {
    // Best-effort.
  }
}

const SAVE_DEBOUNCE_MS = 300;
/** How long the "reached target" cue (readout flash + row highlight) stays on. */
const CUE_MS = 900;

/** The `useMetronome()` slice the trainer reads + writes. */
export interface TempoTrainerPort {
  bpm: number;
  isRunning: boolean;
  setBpm: (bpm: number) => void;
}

/** Stable engine-event sink bridged into `useMetronome({ events })` in MetronomeApp. */
export interface TrainerDriver {
  /** Beat 0 of a measure — the trainer's clock tick. */
  onMeasure: () => void;
  /** Playback (re)started — reset the bar counter so a drill begins on a clean bar 1. */
  onStart: () => void;
}

export interface TempoTrainerReturn extends TrainerConfig {
  enabled: boolean;
  setTarget: (n: number) => void;
  setStep: (n: number) => void;
  setInterval: (n: number) => void;
  setEnabled: (v: boolean) => void;
  toggleEnabled: () => void;
  /** Apply URL-provided config (a shared link wins over localStorage). */
  applyConfig: (c: Partial<TrainerConfig>) => void;
  /** True briefly after the ramp reaches its target (drives the cue). */
  justReached: boolean;
  /** BPM setter for USER gestures — disarms the trainer, then delegates to the engine. */
  handleUserBpm: (bpm: number) => void;
  driver: TrainerDriver;
}

export function useTempoTrainer(m: TempoTrainerPort): TempoTrainerReturn {
  // Read storage exactly once for the lazy initializers below.
  const initial = useRef<Partial<PersistedTrainer> | null>(null);
  if (initial.current === null) initial.current = readStoredTrainer();
  const stored = initial.current;

  const [target, setTargetState] = useState(() => clampTarget(stored.target ?? TRAINER_DEFAULTS.target));
  const [step, setStepState] = useState(() => clampStep(stored.step ?? TRAINER_DEFAULTS.step));
  const [interval, setIntervalState] = useState(() =>
    clampInterval(stored.interval ?? TRAINER_DEFAULTS.interval),
  );
  const [enabled, setEnabledState] = useState<boolean>(() => stored.enabled ?? false);
  const [justReached, setJustReached] = useState(false);

  // Mirror live values into refs so `driver`/`handleUserBpm` keep a stable identity
  // yet always read current state (the driver is built once, below).
  const bpmRef = useRef(m.bpm);
  bpmRef.current = m.bpm;
  const runningRef = useRef(m.isRunning);
  runningRef.current = m.isRunning;
  const setBpmRef = useRef(m.setBpm);
  setBpmRef.current = m.setBpm;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const targetRef = useRef(target);
  targetRef.current = target;
  const stepRef = useRef(step);
  stepRef.current = step;
  const intervalRef = useRef(interval);
  intervalRef.current = interval;

  const barCount = useRef(0);
  const cueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireCue = useCallback(() => {
    setJustReached(true);
    if (cueTimer.current) clearTimeout(cueTimer.current);
    cueTimer.current = setTimeout(() => setJustReached(false), CUE_MS);
  }, []);

  // Clear a pending cue timer on unmount.
  useEffect(() => () => void (cueTimer.current && clearTimeout(cueTimer.current)), []);

  const setTarget = useCallback((n: number) => setTargetState(clampTarget(n)), []);
  const setStep = useCallback((n: number) => setStepState(clampStep(n)), []);
  const setInterval = useCallback((n: number) => setIntervalState(clampInterval(n)), []);

  const setEnabled = useCallback((v: boolean) => {
    if (v) barCount.current = 0; // counting starts when the trainer begins driving
    setEnabledState(v);
  }, []);
  const toggleEnabled = useCallback(() => setEnabled(!enabledRef.current), [setEnabled]);

  const applyConfig = useCallback((c: Partial<TrainerConfig>) => {
    if (c.target !== undefined) setTargetState(clampTarget(c.target));
    if (c.step !== undefined) setStepState(clampStep(c.step));
    if (c.interval !== undefined) setIntervalState(clampInterval(c.interval));
  }, []);

  // The single BPM choke point for user gestures (slider/steppers/tap/Space). Any
  // manual tempo change disarms the trainer so it never fights the user; the
  // trainer's own step calls `setBpm` directly in the driver, so it never disarms
  // itself (the distinction is structural — different call sites, no flag).
  const handleUserBpm = useCallback((bpm: number) => {
    if (enabledRef.current) setEnabledState(false);
    setBpmRef.current(bpm);
  }, []);

  // Built once — stable identity for the MetronomeApp event bridge. Reads all live
  // state through refs.
  const driver = useRef<TrainerDriver | null>(null);
  if (driver.current === null) {
    driver.current = {
      onStart: () => {
        barCount.current = 0;
      },
      onMeasure: () => {
        if (!enabledRef.current || !runningRef.current) return;
        const cur = bpmRef.current;
        // Target at/below current → nothing to climb: disarm silently (no ramp-down, no cue).
        if (reachedTarget(cur, targetRef.current)) {
          barCount.current = 0;
          setEnabledState(false);
          return;
        }
        barCount.current += 1;
        if (barCount.current < intervalRef.current) return;
        barCount.current = 0;
        const next = nextTrainerBpm(cur, stepRef.current, targetRef.current);
        setBpmRef.current(next);
        if (reachedTarget(next, targetRef.current)) {
          setEnabledState(false); // reached the goal — disarm
          fireCue();
        }
      },
    };
  }

  // Debounced persistence of config + enabled (skip the first run — values just came
  // from storage/defaults; URL restore, if any, writes after mount).
  const firstSave = useRef(true);
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    const id = setTimeout(() => writeTrainer({ target, step, interval, enabled }), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [target, step, interval, enabled]);

  return {
    target,
    step,
    interval,
    enabled,
    setTarget,
    setStep,
    setInterval,
    setEnabled,
    toggleEnabled,
    applyConfig,
    justReached,
    handleUserBpm,
    driver: driver.current,
  };
}
