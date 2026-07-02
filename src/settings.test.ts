import { renderHook } from '@testing-library/react';
import {
  parseSettings,
  serializeSettings,
  readStoredSettings,
  writeSettings,
  usePersistSettings,
  type PersistedSettings,
} from './settings';

function makeMockM(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    bpm: 120,
    timeSignature: { id: '4/4' },
    subdivision: 'off' as const,
    swing: 0.5,
    volume: 0.7,
    clickMuted: false,
    setBpm: vi.fn(),
    setTimeSignature: vi.fn(),
    setSubdivision: vi.fn(),
    setSwing: vi.fn(),
    setVolume: vi.fn(),
    setClickMuted: vi.fn(),
    ...overrides,
  };
}

const sample: PersistedSettings = {
  bpm: 132,
  timeSignatureId: '6/8',
  subdivision: 'sextuplets',
  swing: 0.7,
  volume: 0.9,
  clickMuted: false,
};

describe('parseSettings', () => {
  it('returns all valid fields from a well-formed blob', () => {
    const raw = JSON.stringify({
      v: 1,
      bpm: 90,
      timeSignatureId: '3/4',
      subdivision: '8ths',
      swing: 0.6,
      volume: 0.5,
      clickMuted: true,
    });
    expect(parseSettings(raw)).toEqual({
      bpm: 90,
      timeSignatureId: '3/4',
      subdivision: '8ths',
      swing: 0.6,
      volume: 0.5,
      clickMuted: true,
    });
  });

  it('returns {} for missing, corrupt, or non-object JSON', () => {
    expect(parseSettings(null)).toEqual({});
    expect(parseSettings('not json')).toEqual({});
    expect(parseSettings('5')).toEqual({});
    expect(parseSettings('"x"')).toEqual({});
    expect(parseSettings('null')).toEqual({});
  });

  it('drops every field that has the wrong type', () => {
    const raw = JSON.stringify({
      bpm: 'fast',
      timeSignatureId: 4,
      subdivision: 'nope',
      swing: 'x',
      volume: null,
      clickMuted: 'yes',
    });
    expect(parseSettings(raw)).toEqual({});
  });

  it('drops non-finite numbers (NaN/Infinity serialize to null)', () => {
    const raw = JSON.stringify({ bpm: Infinity, swing: NaN, volume: 0.4 });
    expect(parseSettings(raw)).toEqual({ volume: 0.4 });
  });

  it('keeps only the valid fields from a partial blob', () => {
    const raw = JSON.stringify({ bpm: 100, subdivision: 'triplets', clickMuted: 'not-a-bool' });
    expect(parseSettings(raw)).toEqual({ bpm: 100, subdivision: 'triplets' });
  });
});

describe('serializeSettings', () => {
  it('round-trips through parseSettings', () => {
    expect(parseSettings(serializeSettings(sample))).toEqual(sample);
  });

  it('stamps a version field', () => {
    expect(JSON.parse(serializeSettings(sample))).toMatchObject({ v: 1 });
  });
});

describe('readStoredSettings / writeSettings', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through localStorage', () => {
    writeSettings(sample);
    expect(readStoredSettings()).toEqual(sample);
  });

  it('returns {} when nothing is stored', () => {
    expect(readStoredSettings()).toEqual({});
  });
});

describe('usePersistSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('restores stored settings via the setters on mount', () => {
    writeSettings(sample);
    const m = makeMockM();
    renderHook(() => usePersistSettings(m));
    // timeSignature first (its setter clears accents), then the rest.
    expect(m.setTimeSignature).toHaveBeenCalledWith('6/8');
    expect(m.setBpm).toHaveBeenCalledWith(132);
    expect(m.setSubdivision).toHaveBeenCalledWith('sextuplets');
    expect(m.setSwing).toHaveBeenCalledWith(0.7);
    expect(m.setVolume).toHaveBeenCalledWith(0.9);
    expect(m.setClickMuted).toHaveBeenCalledWith(false);
  });

  it('touches nothing when storage is empty', () => {
    const m = makeMockM();
    renderHook(() => usePersistSettings(m));
    expect(m.setBpm).not.toHaveBeenCalled();
    expect(m.setTimeSignature).not.toHaveBeenCalled();
  });

  it('persists a changed setting after the debounce window', () => {
    const { rerender } = renderHook(({ m }) => usePersistSettings(m), {
      initialProps: { m: makeMockM({ bpm: 100 }) },
    });
    rerender({ m: makeMockM({ bpm: 101 }) });
    vi.advanceTimersByTime(500);
    expect(readStoredSettings().bpm).toBe(101);
  });
});
