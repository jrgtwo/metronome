import { renderHook, act } from '@testing-library/react';
import {
  nextTrainerBpm,
  reachedTarget,
  clampTarget,
  clampStep,
  clampInterval,
  parseTrainer,
  serializeTrainer,
  readStoredTrainer,
  writeTrainer,
  useTempoTrainer,
  TRAINER_DEFAULTS,
  type PersistedTrainer,
  type TempoTrainerPort,
} from './tempoTrainer';

describe('ramp math', () => {
  it('nextTrainerBpm holds at the target without overshooting', () => {
    expect(nextTrainerBpm(100, 5, 140)).toBe(105);
    expect(nextTrainerBpm(138, 5, 140)).toBe(140); // would be 143 → clamped to target
    expect(nextTrainerBpm(140, 5, 140)).toBe(140);
  });

  it('reachedTarget is a >= comparison', () => {
    expect(reachedTarget(139, 140)).toBe(false);
    expect(reachedTarget(140, 140)).toBe(true);
    expect(reachedTarget(141, 140)).toBe(true);
  });
});

describe('clamps (round + bound)', () => {
  it('clampTarget bounds to 40..240 and rounds', () => {
    expect(clampTarget(9999)).toBe(240);
    expect(clampTarget(10)).toBe(40);
    expect(clampTarget(120.6)).toBe(121);
  });
  it('clampStep bounds to 1..30', () => {
    expect(clampStep(999)).toBe(30);
    expect(clampStep(0)).toBe(1);
    expect(clampStep(5)).toBe(5);
  });
  it('clampInterval bounds to 1..16', () => {
    expect(clampInterval(0)).toBe(1);
    expect(clampInterval(100)).toBe(16);
    expect(clampInterval(4)).toBe(4);
  });
});

const sample: PersistedTrainer = { target: 160, step: 10, interval: 8, enabled: true };

describe('parseTrainer', () => {
  it('returns all valid fields from a well-formed blob', () => {
    const raw = JSON.stringify({ v: 1, target: 150, step: 3, interval: 2, enabled: true });
    expect(parseTrainer(raw)).toEqual({ target: 150, step: 3, interval: 2, enabled: true });
  });

  it('returns {} for missing, corrupt, or non-object JSON', () => {
    expect(parseTrainer(null)).toEqual({});
    expect(parseTrainer('not json')).toEqual({});
    expect(parseTrainer('5')).toEqual({});
    expect(parseTrainer('null')).toEqual({});
  });

  it('drops wrong-typed fields', () => {
    const raw = JSON.stringify({ target: 'fast', step: null, interval: 'x', enabled: 'yes' });
    expect(parseTrainer(raw)).toEqual({});
  });

  it('drops non-finite numbers and keeps the valid remainder', () => {
    const raw = JSON.stringify({ target: Infinity, step: NaN, interval: 4, enabled: false });
    expect(parseTrainer(raw)).toEqual({ interval: 4, enabled: false });
  });
});

describe('serialize / storage round-trip', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through parseTrainer and stamps a version', () => {
    expect(parseTrainer(serializeTrainer(sample))).toEqual(sample);
    expect(JSON.parse(serializeTrainer(sample))).toMatchObject({ v: 1 });
  });

  it('round-trips through localStorage', () => {
    writeTrainer(sample);
    expect(readStoredTrainer()).toEqual(sample);
  });

  it('returns {} when nothing is stored', () => {
    expect(readStoredTrainer()).toEqual({});
  });
});

function makeM(overrides: Partial<TempoTrainerPort> = {}): TempoTrainerPort {
  return { bpm: 100, isRunning: true, setBpm: vi.fn(), ...overrides };
}

// Fire the measure event `n` times inside act().
function beat(result: { current: { driver: { onMeasure: () => void } } }, n = 1) {
  act(() => {
    for (let i = 0; i < n; i++) result.current.driver.onMeasure();
  });
}

describe('useTempoTrainer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes config from defaults when storage is empty', () => {
    const { result } = renderHook(() => useTempoTrainer(makeM()));
    expect(result.current.target).toBe(TRAINER_DEFAULTS.target);
    expect(result.current.step).toBe(TRAINER_DEFAULTS.step);
    expect(result.current.interval).toBe(TRAINER_DEFAULTS.interval);
    expect(result.current.enabled).toBe(false);
  });

  it('lazy-inits config (clamped) from localStorage', () => {
    writeTrainer({ target: 9999, step: 3, interval: 2, enabled: true });
    const { result } = renderHook(() => useTempoTrainer(makeM()));
    expect(result.current.target).toBe(240); // clamped on init
    expect(result.current.step).toBe(3);
    expect(result.current.interval).toBe(2);
    expect(result.current.enabled).toBe(true);
  });

  it('steps BPM up exactly on the Nth bar, not before', () => {
    const m = makeM({ bpm: 100 }); // defaults: target 140, step 5, interval 4
    const { result } = renderHook(() => useTempoTrainer(m));
    act(() => result.current.setEnabled(true));

    beat(result, 3);
    expect(m.setBpm).not.toHaveBeenCalled();
    beat(result, 1); // 4th bar
    expect(m.setBpm).toHaveBeenCalledExactlyOnceWith(105);
  });

  it('holds at target, disarms, and flashes the cue (auto-clearing)', () => {
    const m = makeM({ bpm: 138 });
    const { result } = renderHook(() => useTempoTrainer(m));
    act(() => {
      result.current.setInterval(1);
      result.current.setEnabled(true);
    });

    beat(result, 1); // 138 + 5 → clamped to target 140
    expect(m.setBpm).toHaveBeenCalledExactlyOnceWith(140);
    expect(result.current.enabled).toBe(false); // disarmed on reach
    expect(result.current.justReached).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.justReached).toBe(false);
  });

  it('does nothing when disarmed', () => {
    const m = makeM();
    const { result } = renderHook(() => useTempoTrainer(m));
    beat(result, 10);
    expect(m.setBpm).not.toHaveBeenCalled();
  });

  it('does nothing while the metronome is stopped', () => {
    const m = makeM({ isRunning: false });
    const { result } = renderHook(() => useTempoTrainer(m));
    act(() => result.current.setEnabled(true));
    beat(result, 10);
    expect(m.setBpm).not.toHaveBeenCalled();
  });

  it('onStart resets the bar counter', () => {
    const m = makeM({ bpm: 100 }); // interval 4
    const { result } = renderHook(() => useTempoTrainer(m));
    act(() => result.current.setEnabled(true));

    beat(result, 3); // count = 3
    act(() => result.current.driver.onStart()); // reset → count = 0
    beat(result, 3);
    expect(m.setBpm).not.toHaveBeenCalled(); // only 3 since reset
    beat(result, 1); // 4th after reset
    expect(m.setBpm).toHaveBeenCalledExactlyOnceWith(105);
  });

  it('handleUserBpm disarms the trainer and passes the value through', () => {
    const m = makeM();
    const { result } = renderHook(() => useTempoTrainer(m));
    act(() => result.current.setEnabled(true));
    act(() => result.current.handleUserBpm(155));
    expect(result.current.enabled).toBe(false);
    expect(m.setBpm).toHaveBeenCalledExactlyOnceWith(155);
  });

  it('disarms silently (no ramp-down, no cue) when the target is at/below current', () => {
    const m = makeM({ bpm: 100 });
    const { result } = renderHook(() => useTempoTrainer(m));
    act(() => {
      result.current.setInterval(1);
      result.current.setEnabled(true); // armed with default target 140 (> 100)
    });
    act(() => result.current.setTarget(90)); // now target < current, still armed
    beat(result, 1);
    expect(m.setBpm).not.toHaveBeenCalled(); // no downward ramp
    expect(result.current.enabled).toBe(false); // silently disarmed
    expect(result.current.justReached).toBe(false); // no cue
  });

  it('setters clamp their inputs', () => {
    const { result } = renderHook(() => useTempoTrainer(makeM()));
    act(() => {
      result.current.setTarget(9999);
      result.current.setStep(999);
      result.current.setInterval(0);
    });
    expect(result.current.target).toBe(240);
    expect(result.current.step).toBe(30);
    expect(result.current.interval).toBe(1);
  });

  it('applyConfig sets multiple fields (clamped) for URL restore', () => {
    const { result } = renderHook(() => useTempoTrainer(makeM()));
    act(() => result.current.applyConfig({ target: 9999, step: 8 }));
    expect(result.current.target).toBe(240);
    expect(result.current.step).toBe(8);
    expect(result.current.interval).toBe(TRAINER_DEFAULTS.interval); // untouched
  });

  it('persists config changes to localStorage after the debounce', () => {
    const { result } = renderHook(() => useTempoTrainer(makeM()));
    act(() => result.current.setTarget(150));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(readStoredTrainer().target).toBe(150);
  });
});
