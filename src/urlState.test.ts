import { renderHook } from '@testing-library/react';
import { parseUrlSettings, buildUrlQuery, parseTrainerUrl, useUrlState } from './urlState';

function makeMockM(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    bpm: 120,
    timeSignature: { id: '4/4' },
    subdivision: 'off' as const,
    swing: 0.5,
    setBpm: vi.fn(),
    setTimeSignature: vi.fn(),
    setSubdivision: vi.fn(),
    setSwing: vi.fn(),
    ...overrides,
  };
}

function makeMockTrainer(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    target: 140, // TRAINER_DEFAULTS
    step: 5,
    interval: 4,
    applyConfig: vi.fn(),
    ...overrides,
  };
}

describe('parseUrlSettings', () => {
  it('reads the musical settings from a query string', () => {
    expect(parseUrlSettings('?bpm=140&sig=3/4&sub=8ths&swing=0.6')).toEqual({
      bpm: 140,
      timeSignatureId: '3/4',
      subdivision: '8ths',
      swing: 0.6,
    });
  });

  it('returns {} for an empty query', () => {
    expect(parseUrlSettings('')).toEqual({});
    expect(parseUrlSettings('?')).toEqual({});
  });

  it('drops absent, non-numeric, or unknown-subdivision params', () => {
    expect(parseUrlSettings('?bpm=fast&sub=nope&swing=x')).toEqual({});
  });

  it('keeps only the present, valid params', () => {
    expect(parseUrlSettings('?bpm=90')).toEqual({ bpm: 90 });
  });
});

describe('parseTrainerUrl', () => {
  it('reads the trainer config from a query string', () => {
    expect(parseTrainerUrl('?tt=160&ts=10&ti=8')).toEqual({ target: 160, step: 10, interval: 8 });
  });

  it('ignores absent and non-numeric params', () => {
    expect(parseTrainerUrl('?bpm=120')).toEqual({});
    expect(parseTrainerUrl('?tt=fast&ts=x')).toEqual({});
  });

  it('keeps only the present, valid params', () => {
    expect(parseTrainerUrl('?ti=2')).toEqual({ interval: 2 });
  });
});

describe('buildUrlQuery', () => {
  const DEFAULTS = { bpm: 120, timeSignatureId: '4/4', subdivision: 'off', swing: 0.5 } as const;

  it('is empty when every setting is at its default (clean URL)', () => {
    expect(buildUrlQuery(DEFAULTS)).toBe('');
  });

  it('includes only the settings that differ from default', () => {
    expect(buildUrlQuery({ ...DEFAULTS, bpm: 140 })).toBe('bpm=140');
  });

  it('round-trips through parseUrlSettings', () => {
    const s = { bpm: 140, timeSignatureId: '3/4', subdivision: '8ths', swing: 0.6 } as const;
    expect(parseUrlSettings('?' + buildUrlQuery(s))).toEqual(s);
  });

  it('omits trainer params at their defaults, includes changed ones', () => {
    expect(buildUrlQuery(DEFAULTS, { target: 140, step: 5, interval: 4 })).toBe('');
    expect(buildUrlQuery(DEFAULTS, { target: 160, step: 5, interval: 4 })).toBe('tt=160');
  });

  it('round-trips trainer config through parseTrainerUrl', () => {
    const t = { target: 180, step: 3, interval: 2 };
    expect(parseTrainerUrl('?' + buildUrlQuery(DEFAULTS, t))).toEqual(t);
  });
});

describe('useUrlState', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'));

  it('applies URL params via the setters on mount (a shared link wins)', () => {
    window.history.replaceState(null, '', '/?bpm=140&sig=3/4&sub=8ths&swing=0.6');
    const m = makeMockM();
    renderHook(() => useUrlState(m));
    expect(m.setTimeSignature).toHaveBeenCalledWith('3/4');
    expect(m.setBpm).toHaveBeenCalledWith(140);
    expect(m.setSubdivision).toHaveBeenCalledWith('8ths');
    expect(m.setSwing).toHaveBeenCalledWith(0.6);
  });

  it('touches nothing on mount when there are no params', () => {
    const m = makeMockM();
    renderHook(() => useUrlState(m));
    expect(m.setBpm).not.toHaveBeenCalled();
  });

  it('reflects non-default state into the URL (debounced)', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = renderHook(({ m }) => useUrlState(m), {
        initialProps: { m: makeMockM({ bpm: 120 }) },
      });
      rerender({ m: makeMockM({ bpm: 155 }) });
      vi.advanceTimersByTime(400);
      expect(window.location.search).toBe('?bpm=155');
    } finally {
      vi.useRealTimers();
    }
  });

  it('strips the query when state returns to default', () => {
    vi.useFakeTimers();
    try {
      window.history.replaceState(null, '', '/?bpm=155');
      const { rerender } = renderHook(({ m }) => useUrlState(m), {
        initialProps: { m: makeMockM({ bpm: 155 }) },
      });
      rerender({ m: makeMockM({ bpm: 120 }) });
      vi.advanceTimersByTime(400);
      expect(window.location.search).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies trainer URL params via applyConfig on mount', () => {
    window.history.replaceState(null, '', '/?tt=160&ts=10&ti=8');
    const trainer = makeMockTrainer();
    renderHook(() => useUrlState(makeMockM(), trainer));
    expect(trainer.applyConfig).toHaveBeenCalledWith({ target: 160, step: 10, interval: 8 });
  });

  it('mirrors non-default trainer config into the URL (debounced)', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = renderHook(({ trainer }) => useUrlState(makeMockM(), trainer), {
        initialProps: { trainer: makeMockTrainer({ target: 140 }) },
      });
      rerender({ trainer: makeMockTrainer({ target: 170 }) });
      vi.advanceTimersByTime(400);
      expect(window.location.search).toBe('?tt=170');
    } finally {
      vi.useRealTimers();
    }
  });
});
