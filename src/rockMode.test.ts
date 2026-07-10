import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  absoluteBeat,
  launchCountdown,
  concertProgress,
  shouldEnterConcert,
  isLevelUp,
  nextAct,
  useRockMode,
  COUNT_IN_BEATS,
  VICTORY_MS,
  type Act,
  type RockInput,
  type RockMetronomePort,
  type RockTrainerPort,
} from './rockMode';

describe('absoluteBeat', () => {
  it('is a cumulative beat index across measures', () => {
    expect(absoluteBeat(0, 0, 4)).toBe(0);
    expect(absoluteBeat(0, 3, 4)).toBe(3);
    expect(absoluteBeat(2, 3, 4)).toBe(11);
    expect(absoluteBeat(1, 0, 3)).toBe(3);
  });
});

describe('launchCountdown', () => {
  it('counts the count-in beats down, then flips to go', () => {
    expect(launchCountdown(0)).toEqual({ count: COUNT_IN_BEATS, go: false });
    expect(launchCountdown(1)).toEqual({ count: 3, go: false });
    expect(launchCountdown(3)).toEqual({ count: 1, go: false });
    expect(launchCountdown(4)).toEqual({ count: 0, go: true });
  });

  it('stays go (count clamped at 0) past the count-in', () => {
    expect(launchCountdown(7)).toEqual({ count: 0, go: true });
  });

  it('honors a custom count-in length', () => {
    expect(launchCountdown(0, 2)).toEqual({ count: 2, go: false });
    expect(launchCountdown(2, 2)).toEqual({ count: 0, go: true });
  });
});

describe('concertProgress', () => {
  it('is 0 at the start bpm and 1 at the target', () => {
    expect(concertProgress(90, 90, 140)).toBe(0);
    expect(concertProgress(90, 140, 140)).toBe(1);
  });

  it('is the fraction of the climb in between', () => {
    expect(concertProgress(90, 115, 140)).toBeCloseTo(0.5, 5);
  });

  it('clamps below 0 and above 1', () => {
    expect(concertProgress(90, 80, 140)).toBe(0);
    expect(concertProgress(90, 200, 140)).toBe(1);
  });

  it('is 1 when the target is not above the start (no climb)', () => {
    expect(concertProgress(140, 140, 140)).toBe(1);
    expect(concertProgress(150, 140, 120)).toBe(1);
  });
});

describe('shouldEnterConcert', () => {
  it('is true only when there is room to climb', () => {
    expect(shouldEnterConcert(90, 140)).toBe(true);
    expect(shouldEnterConcert(140, 140)).toBe(false);
    expect(shouldEnterConcert(150, 140)).toBe(false);
  });
});

describe('isLevelUp', () => {
  it('is true only when bpm increased', () => {
    expect(isLevelUp(90, 95)).toBe(true);
    expect(isLevelUp(95, 95)).toBe(false);
    expect(isLevelUp(95, 90)).toBe(false);
  });
});

describe('nextAct', () => {
  const base: RockInput = {
    enabled: true,
    isRunning: true,
    beatsElapsed: 0,
    countIn: 4,
    atTarget: false,
    enteredConcert: true,
    victoryElapsedMs: 0,
  };
  const from = (prev: Act, over: Partial<RockInput>) => nextAct(prev, { ...base, ...over });

  it('drops to idle whenever disarmed or stopped, from any act', () => {
    expect(from('climb', { enabled: false })).toBe('idle');
    expect(from('climb', { isRunning: false })).toBe('idle');
    expect(from('launch', { isRunning: false })).toBe('idle');
    expect(from('victory', { enabled: false })).toBe('idle');
    expect(from('done', { enabled: false })).toBe('idle');
  });

  it('enters launch from idle only when armed, running, and there is room to climb', () => {
    expect(from('idle', {})).toBe('launch');
    expect(from('idle', { enteredConcert: false })).toBe('idle');
  });

  it('holds in launch until the count-in (one measure) elapses, then goes to climb', () => {
    expect(from('launch', { beatsElapsed: 2, countIn: 4 })).toBe('launch');
    expect(from('launch', { beatsElapsed: 4, countIn: 4 })).toBe('climb');
  });

  it('scales the count-in to the time signature (3 beats in 3/4)', () => {
    expect(from('launch', { beatsElapsed: 2, countIn: 3 })).toBe('launch');
    expect(from('launch', { beatsElapsed: 3, countIn: 3 })).toBe('climb');
  });

  it('goes straight from launch to victory if already at target after the count-in', () => {
    expect(from('launch', { beatsElapsed: COUNT_IN_BEATS, atTarget: true })).toBe('victory');
  });

  it('climbs until the target, then goes to victory', () => {
    expect(from('climb', {})).toBe('climb');
    expect(from('climb', { atTarget: true })).toBe('victory');
  });

  it('holds victory until the victory window elapses, then parks in done', () => {
    expect(from('victory', { atTarget: true, victoryElapsedMs: 1000 })).toBe('victory');
    expect(from('victory', { atTarget: true, victoryElapsedMs: VICTORY_MS })).toBe('done');
  });

  it('stays parked in done (does not re-launch while still armed at target)', () => {
    expect(from('done', { atTarget: true, enteredConcert: true })).toBe('done');
  });
});

function makeM(o: Partial<RockMetronomePort> = {}): RockMetronomePort {
  return { bpm: 100, isRunning: true, currentBeat: 0, currentMeasure: 0, timeSignature: { numerator: 4 }, ...o };
}
function makeTrainer(o: Partial<RockTrainerPort> = {}): RockTrainerPort {
  return { enabled: true, target: 140, setEnabled: vi.fn(), ...o };
}
interface Props {
  m: RockMetronomePort;
  trainer: RockTrainerPort;
}
const setup = (p: Props) => renderHook((pr: Props) => useRockMode(pr.m, pr.trainer), { initialProps: p });

describe('useRockMode', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('stays idle until armed + running with room to climb', () => {
    const { result } = setup({ m: makeM({ isRunning: false }), trainer: makeTrainer() });
    expect(result.current.act).toBe('idle');
  });

  it('launches and captures the start-bpm when armed + running with room to climb', () => {
    const { result } = setup({ m: makeM({ bpm: 96 }), trainer: makeTrainer({ target: 140 }) });
    expect(result.current.act).toBe('launch');
    expect(result.current.startBpm).toBe(96);
  });

  it('does not launch when the target is already met at arm (no room to climb)', () => {
    const { result } = setup({ m: makeM({ bpm: 150 }), trainer: makeTrainer({ target: 140 }) });
    expect(result.current.act).toBe('idle');
  });

  it('advances launch → climb after one measure of count-in (4/4)', () => {
    const trainer = makeTrainer();
    const { result, rerender } = setup({ m: makeM(), trainer });
    expect(result.current.act).toBe('launch');
    // One full 4/4 measure after beat 0.
    act(() => rerender({ m: makeM({ currentMeasure: 1, currentBeat: 0 }), trainer }));
    expect(result.current.act).toBe('climb');
  });

  it('makes the count-in one measure of the current meter (3 beats in 3/4)', () => {
    const trainer = makeTrainer();
    const sig = { numerator: 3 };
    const { result, rerender } = setup({ m: makeM({ timeSignature: sig }), trainer });
    expect(result.current.act).toBe('launch');
    // Still counting in at 2 of 3 beats.
    act(() => rerender({ m: makeM({ timeSignature: sig, currentBeat: 2 }), trainer }));
    expect(result.current.act).toBe('launch');
    // One full 3/4 measure elapsed → climb.
    act(() => rerender({ m: makeM({ timeSignature: sig, currentMeasure: 1, currentBeat: 0 }), trainer }));
    expect(result.current.act).toBe('climb');
  });

  it('reports climb progress from the start-bpm toward the target', () => {
    const trainer = makeTrainer({ target: 140 });
    const { result, rerender } = setup({ m: makeM({ bpm: 100 }), trainer });
    act(() => rerender({ m: makeM({ bpm: 100, currentMeasure: 1 }), trainer })); // → climb
    act(() => rerender({ m: makeM({ bpm: 120, currentMeasure: 2 }), trainer }));
    expect(result.current.progress).toBeCloseTo(0.5, 5);
  });

  it('bumps the level-up key each time the bpm steps up during the climb', () => {
    const trainer = makeTrainer({ target: 140 });
    const { result, rerender } = setup({ m: makeM({ bpm: 100 }), trainer });
    act(() => rerender({ m: makeM({ bpm: 100, currentMeasure: 1 }), trainer })); // → climb
    const before = result.current.levelUpKey;
    act(() => rerender({ m: makeM({ bpm: 110, currentMeasure: 2 }), trainer }));
    expect(result.current.levelUpKey).toBe(before + 1);
  });

  it('reaches the target → victory, then parks in done and disarms the trainer', () => {
    const trainer = makeTrainer({ target: 140 });
    const { result, rerender } = setup({ m: makeM({ bpm: 100 }), trainer });
    act(() => rerender({ m: makeM({ bpm: 100, currentMeasure: 1 }), trainer })); // → climb
    act(() => rerender({ m: makeM({ bpm: 140, currentMeasure: 2 }), trainer })); // hits target
    expect(result.current.act).toBe('victory');
    act(() => {
      vi.advanceTimersByTime(VICTORY_MS);
    });
    expect(result.current.act).toBe('done');
    expect(trainer.setEnabled).toHaveBeenCalledWith(false);
  });

  it('closes back to idle and clears the start-bpm when playback stops', () => {
    const trainer = makeTrainer();
    const { result, rerender } = setup({ m: makeM(), trainer });
    expect(result.current.act).toBe('launch');
    act(() => rerender({ m: makeM({ isRunning: false }), trainer }));
    expect(result.current.act).toBe('idle');
    expect(result.current.startBpm).toBeNull();
  });
});
