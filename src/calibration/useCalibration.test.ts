import { renderHook, act } from '@testing-library/react';
import { setCalibrationOffsetMs, scheduleCalibrationClick } from '@fretwork/lib';
import { useCalibration } from './useCalibration';

// The tap-in flow talks to the lib's audio clock + click scheduler. We mock the
// whole lib boundary with a controllable fake clock (`libState.now`) and spies, so
// we can drive `startTapIn → registerTap → finish/cancel` deterministically. The
// scheduler uses setInterval → fake timers. LOOKAHEAD (0.12s) matches the hook.
const LOOKAHEAD = 0.12;

const libState = vi.hoisted(() => ({
  now: 0,
  outputLatencySec: 0.01,
  offsetMs: 0,
  scheduled: [] as number[],
}));

vi.mock('@fretwork/lib', () => ({
  startAudio: vi.fn(() => Promise.resolve()),
  audioNow: () => libState.now,
  getOutputLatencySec: () => libState.outputLatencySec,
  getEffectiveLatencySec: () => libState.outputLatencySec + libState.offsetMs / 1000,
  getCalibrationOffsetMs: () => libState.offsetMs,
  setCalibrationOffsetMs: vi.fn((ms: number) => {
    libState.offsetMs = ms;
  }),
  clearCalibrationOffset: vi.fn(() => {
    libState.offsetMs = 0;
  }),
  scheduleCalibrationClick: vi.fn((at: number) => {
    libState.scheduled.push(at);
  }),
  installDeviceChangeListener: vi.fn(),
  refreshOutputDeviceLabel: vi.fn(() => Promise.resolve()),
  requestDeviceLabelPermission: vi.fn(() => Promise.resolve()),
  isOutputBluetooth: vi.fn(() => Promise.resolve(false)),
  getCurrentDeviceLabel: vi.fn(() => null),
}));

describe('useCalibration — tap-in state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    libState.now = 0;
    libState.outputLatencySec = 0.01;
    libState.offsetMs = 0;
    libState.scheduled = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderCal() {
    const hook = renderHook(() => useCalibration());
    return hook;
  }

  async function startTapIn(result: { current: ReturnType<typeof useCalibration> }) {
    await act(async () => {
      await result.current.startTapIn();
    });
  }

  // Schedule a click at time `i` (via one interval tick) then tap it `delta` later.
  // The scheduler stores `audioNow() + LOOKAHEAD`, so setting now=i schedules i+LOOKAHEAD;
  // tapping at (i+LOOKAHEAD)+delta yields exactly `delta` as the measured gap.
  function tapAt(
    result: { current: ReturnType<typeof useCalibration> },
    i: number,
    delta: number,
  ) {
    libState.now = i;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    libState.now = i + LOOKAHEAD + delta;
    act(() => {
      result.current.registerTap();
    });
  }

  it('startTapIn arms the session and schedules a click immediately', async () => {
    const { result } = renderCal();
    expect(result.current.tapRunning).toBe(false);

    await startTapIn(result);

    expect(result.current.tapRunning).toBe(true);
    expect(result.current.tapCount).toBe(0);
    expect(result.current.tapMeasuredMs).toBeNull();
    // one click scheduled right away (before the interval fires)
    expect(vi.mocked(scheduleCalibrationClick)).toHaveBeenCalledTimes(1);
  });

  it('the interval keeps scheduling clicks over time', async () => {
    const { result } = renderCal();
    await startTapIn(result);
    expect(vi.mocked(scheduleCalibrationClick)).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    // immediate + 3 interval ticks
    expect(vi.mocked(scheduleCalibrationClick)).toHaveBeenCalledTimes(4);
  });

  it('registerTap is a no-op until a scheduled click has actually passed', async () => {
    const { result } = renderCal();
    await startTapIn(result); // click scheduled at 0.12, clock still at 0
    act(() => {
      result.current.registerTap(); // now (0) < 0.12 → nothing has played yet
    });
    expect(result.current.tapCount).toBe(0);
    expect(result.current.tapMeasuredMs).toBeNull();
  });

  it('counts taps but withholds a measurement until TAP_MIN_SAMPLES (4)', async () => {
    const { result } = renderCal();
    await startTapIn(result);

    tapAt(result, 1, 0.03);
    tapAt(result, 2, 0.03);
    tapAt(result, 3, 0.03);
    expect(result.current.tapCount).toBe(3);
    expect(result.current.tapMeasuredMs).toBeNull(); // still < 4 samples

    tapAt(result, 4, 0.03);
    expect(result.current.tapCount).toBe(4);
    // median(0.03) − outputLatency(0.01) = 0.02s → 20ms
    expect(result.current.tapMeasuredMs).toBeCloseTo(20, 5);
  });

  it('clamps a measurement below the output latency to 0 (never negative)', async () => {
    const { result } = renderCal();
    await startTapIn(result);
    // deltas (0.005) below outputLatency (0.01) → extra is negative → clamp to 0
    tapAt(result, 1, 0.005);
    tapAt(result, 2, 0.005);
    tapAt(result, 3, 0.005);
    tapAt(result, 4, 0.005);
    expect(result.current.tapMeasuredMs).toBe(0);
  });

  it('keeps only the last TAP_WINDOW (8) samples in the running median', async () => {
    const { result } = renderCal();
    libState.outputLatencySec = 0; // measured == median, in ms
    await startTapIn(result);

    // 8 rising deltas: 0.01 … 0.08 → median = avg(0.04, 0.05) = 0.045 → 45ms
    for (let i = 1; i <= 8; i++) tapAt(result, i, i * 0.01);
    expect(result.current.tapMeasuredMs).toBeCloseTo(45, 5);

    // 9th tap (0.09): if unwindowed, median of [0.01..0.09] = 0.05 → 50ms.
    // Windowed to the last 8 [0.02..0.09] → avg(0.05, 0.06) = 0.055 → 55ms.
    tapAt(result, 9, 0.09);
    expect(result.current.tapMeasuredMs).toBeCloseTo(55, 5);
  });

  it('finishTapIn commits the measured offset and ends the session', async () => {
    const { result } = renderCal();
    await startTapIn(result);
    tapAt(result, 1, 0.03);
    tapAt(result, 2, 0.03);
    tapAt(result, 3, 0.03);
    tapAt(result, 4, 0.03);

    act(() => {
      result.current.finishTapIn();
    });

    expect(vi.mocked(setCalibrationOffsetMs)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(setCalibrationOffsetMs).mock.calls[0][0]).toBeCloseTo(20, 5);
    expect(result.current.tapRunning).toBe(false);
  });

  it('finishTapIn does NOT commit when there were too few taps to measure', async () => {
    const { result } = renderCal();
    await startTapIn(result);
    tapAt(result, 1, 0.03); // only 1 sample → tapMeasuredMs still null

    act(() => {
      result.current.finishTapIn();
    });

    expect(vi.mocked(setCalibrationOffsetMs)).not.toHaveBeenCalled();
    expect(result.current.tapRunning).toBe(false);
  });

  it('cancelTapIn ends the session without committing and resets counts', async () => {
    const { result } = renderCal();
    await startTapIn(result);
    tapAt(result, 1, 0.03);
    tapAt(result, 2, 0.03);
    tapAt(result, 3, 0.03);
    tapAt(result, 4, 0.03);
    expect(result.current.tapMeasuredMs).toBeCloseTo(20, 5);

    act(() => {
      result.current.cancelTapIn();
    });

    expect(vi.mocked(setCalibrationOffsetMs)).not.toHaveBeenCalled();
    expect(result.current.tapRunning).toBe(false);
    expect(result.current.tapCount).toBe(0);
    expect(result.current.tapMeasuredMs).toBeNull();
  });

  it('stops the click scheduler on unmount (no leaked interval)', async () => {
    const { result, unmount } = renderCal();
    await startTapIn(result);
    const scheduledBefore = vi.mocked(scheduleCalibrationClick).mock.calls.length;

    unmount();
    act(() => {
      vi.advanceTimersByTime(5000); // would fire ~5 more ticks if not cleared
    });

    expect(vi.mocked(scheduleCalibrationClick).mock.calls.length).toBe(scheduledBefore);
  });
});
