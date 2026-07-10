import { useEffect, useRef, useState } from 'react';
import { reachedTarget } from './tempoTrainer';

/**
 * Rock Mode (the tempo trainer as a live concert). Arming the trainer and pressing
 * Play runs a three-act "show" — a beat-synced launch countdown, a climb HUD framed
 * around the *real* metronome, and a victory payoff — then disarms.
 *
 * These pure helpers carry the act state machine + progress math so they unit-test
 * without the audio engine (same split as `tempoTrainer.ts`). The `useRockMode` hook
 * (below) owns the captured start-BPM, timers, and level-up transient.
 */

export type Act = 'idle' | 'launch' | 'climb' | 'victory' | 'done';

/** Default count-in length (beats) when a meter isn't supplied. The live count-in is
 *  one full measure — the time signature's numerator (see `useRockMode`). */
export const COUNT_IN_BEATS = 4;
/** How long the victory payoff screen holds before the show closes. */
export const VICTORY_MS = 3500;
/** How long a "LEVEL UP" flare stays on after a BPM bump. */
export const LEVEL_UP_MS = 700;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Cumulative beat index since the engine started (measure-major). */
export function absoluteBeat(measure: number, beat: number, beatsPerBar: number): number {
  return measure * beatsPerBar + beat;
}

/** The count-in view: how many beats remain, and whether it's time to GO. */
export function launchCountdown(
  beatsElapsed: number,
  countIn: number = COUNT_IN_BEATS,
): { count: number; go: boolean } {
  return { count: Math.max(0, countIn - beatsElapsed), go: beatsElapsed >= countIn };
}

/** Fraction of the climb completed (0 at the start bpm, 1 at the target). */
export function concertProgress(startBpm: number, bpm: number, target: number): number {
  if (target <= startBpm) return 1; // no climb — treat as complete
  return clamp01((bpm - startBpm) / (target - startBpm));
}

/** Whether arming here has any room to climb (else there's no show). */
export function shouldEnterConcert(startBpm: number, target: number): boolean {
  return !reachedTarget(startBpm, target);
}

/** Whether the BPM just stepped up (drives the LEVEL UP flare). */
export function isLevelUp(prevBpm: number, bpm: number): boolean {
  return bpm > prevBpm;
}

/** The live signals the act reducer needs (all computed by the hook). */
export interface RockInput {
  enabled: boolean;
  isRunning: boolean;
  /** Beats since play-start (drives the count-in). */
  beatsElapsed: number;
  /** Count-in length in beats — one measure (the time signature's numerator). */
  countIn: number;
  /** Whether the ramp has reached the target. */
  atTarget: boolean;
  /** Whether there was room to climb when the show launched. */
  enteredConcert: boolean;
  /** Time spent on the victory screen so far. */
  victoryElapsedMs: number;
}

/**
 * The act state machine. `idle`/`done` both mean "no takeover"; `done` parks after a
 * victory so the show doesn't immediately re-launch while still armed at target (it
 * clears to `idle` once the hook disarms).
 */
export function nextAct(prev: Act, i: RockInput): Act {
  // Stop or disarm closes the show from any act (and clears the `done` park).
  if (!i.enabled || !i.isRunning) return 'idle';

  switch (prev) {
    case 'idle':
      return i.enteredConcert ? 'launch' : 'idle';
    case 'launch':
      if (i.beatsElapsed < i.countIn) return 'launch';
      return i.atTarget ? 'victory' : 'climb';
    case 'climb':
      return i.atTarget ? 'victory' : 'climb';
    case 'victory':
      return i.victoryElapsedMs >= VICTORY_MS ? 'done' : 'victory';
    case 'done':
      return 'done';
  }
}

/** The `useMetronome()` slice Rock Mode reads. */
export interface RockMetronomePort {
  bpm: number;
  isRunning: boolean;
  currentBeat: number;
  currentMeasure: number;
  timeSignature: { numerator: number };
}

/** The `useTempoTrainer()` slice Rock Mode reads + drives. */
export interface RockTrainerPort {
  enabled: boolean;
  target: number;
  setEnabled: (v: boolean) => void;
}

/** The concert view-model the overlay renders from. */
export interface RockModeView {
  act: Act;
  /** Beats remaining in the count-in (0 once GO). */
  countdown: number;
  go: boolean;
  /** Climb progress toward the target, 0..1. */
  progress: number;
  /** Increments on each BPM bump — key the LEVEL UP flare off this to re-animate. */
  levelUpKey: number;
  /** BPM captured when the show launched (null when idle). */
  startBpm: number | null;
}

/**
 * Runs the concert: derives the current act from the live engine + trainer signals,
 * captures the start-BPM the trainer never exposes (a ref snapshot on the idle→launch
 * edge), times the victory screen, and disarms the trainer when the show ends.
 */
export function useRockMode(m: RockMetronomePort, trainer: RockTrainerPort): RockModeView {
  const [act, setAct] = useState<Act>('idle');
  const [startBpm, setStartBpm] = useState<number | null>(null);
  const [levelUpKey, setLevelUpKey] = useState(0);
  const [victoryElapsed, setVictoryElapsed] = useState(0);

  const startBeatRef = useRef(0);
  const prevBpmRef = useRef(m.bpm);
  const victoryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beatsPerBar = m.timeSignature.numerator;
  // The engine reports -1 for beat/measure when stopped and in the brief window right
  // after start (before the first tick). Clamp so the count-in baseline is never negative.
  const absBeat = absoluteBeat(Math.max(0, m.currentMeasure), Math.max(0, m.currentBeat), beatsPerBar);
  const rampStart = startBpm ?? m.bpm;
  const beatsElapsed = startBpm !== null ? Math.max(0, absBeat - startBeatRef.current) : 0;
  // The count-in is one full measure — so it tracks the meter (4 in 4/4, 3 in 3/4, …).
  const { count, go } = launchCountdown(beatsElapsed, beatsPerBar);
  const progress = concertProgress(rampStart, m.bpm, trainer.target);

  // The act machine: compute the next act from the live signals and apply the
  // side effects of each transition (capture start-BPM, arm/clear the victory timer,
  // disarm on close). Converges to a fixed point per state, so it's self-stable.
  useEffect(() => {
    const next = nextAct(act, {
      enabled: trainer.enabled,
      isRunning: m.isRunning,
      beatsElapsed,
      countIn: beatsPerBar,
      atTarget: reachedTarget(m.bpm, trainer.target),
      enteredConcert: shouldEnterConcert(rampStart, trainer.target),
      victoryElapsedMs: victoryElapsed,
    });
    if (next === act) return;

    if (act === 'idle' && next === 'launch') {
      setStartBpm(m.bpm);
      startBeatRef.current = absBeat;
      prevBpmRef.current = m.bpm;
    }
    if (next === 'victory') {
      setVictoryElapsed(0);
      if (victoryTimer.current) clearTimeout(victoryTimer.current);
      victoryTimer.current = setTimeout(() => setVictoryElapsed(VICTORY_MS), VICTORY_MS);
    }
    if (next === 'done') {
      trainer.setEnabled(false);
    }
    if (next === 'idle') {
      setStartBpm(null);
      startBeatRef.current = 0;
      setVictoryElapsed(0);
      if (victoryTimer.current) clearTimeout(victoryTimer.current);
    }
    setAct(next);
  }, [act, trainer, m.isRunning, m.bpm, beatsElapsed, beatsPerBar, absBeat, rampStart, victoryElapsed]);

  // LEVEL UP: a BPM step-up during the climb re-keys the flare.
  useEffect(() => {
    if (act === 'climb' && isLevelUp(prevBpmRef.current, m.bpm)) {
      setLevelUpKey((k) => k + 1);
    }
    prevBpmRef.current = m.bpm;
  }, [m.bpm, act]);

  // Clear the victory timer on unmount.
  useEffect(() => () => void (victoryTimer.current && clearTimeout(victoryTimer.current)), []);

  return { act, countdown: count, go, progress, levelUpKey, startBpm };
}
