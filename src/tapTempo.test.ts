import { renderHook, act } from '@testing-library/react';
import { bpmFromTaps, pushTap, useTapTempo, TAP_RESET_MS, TAP_WINDOW } from './tapTempo';

function pressSpace() {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
}

describe('bpmFromTaps', () => {
  it('computes BPM from steady intervals (500ms apart → 120)', () => {
    expect(bpmFromTaps([0, 500, 1000, 1500])).toBe(120);
  });

  it('returns null for fewer than two taps', () => {
    expect(bpmFromTaps([])).toBeNull();
    expect(bpmFromTaps([1000])).toBeNull();
  });

  it('uses the median, so one stray double-tap does not skew the tempo', () => {
    // intervals 500, 500, 0, 500 → median 500 → 120 (the 0 is ignored).
    expect(bpmFromTaps([0, 500, 1000, 1000, 1500])).toBe(120);
  });

  it('rounds to the nearest integer BPM', () => {
    // 700ms → 85.7 → 86
    expect(bpmFromTaps([0, 700])).toBe(86);
  });
});

describe('pushTap', () => {
  it('appends a tap within the reset window', () => {
    expect(pushTap([0, 500], 1000)).toEqual([0, 500, 1000]);
  });

  it('starts a fresh sequence after an idle gap longer than the reset window', () => {
    expect(pushTap([1000], 1000 + TAP_RESET_MS + 1)).toEqual([1000 + TAP_RESET_MS + 1]);
  });

  it('keeps a tap right at the reset boundary', () => {
    expect(pushTap([1000], 1000 + TAP_RESET_MS)).toEqual([1000, 1000 + TAP_RESET_MS]);
  });

  it('trims to the rolling window (drops the oldest)', () => {
    const full = Array.from({ length: TAP_WINDOW }, (_, i) => i * 500);
    const next = pushTap(full, TAP_WINDOW * 500);
    expect(next).toHaveLength(TAP_WINDOW);
    expect(next[0]).toBe(500); // the original first tap (0) was dropped
    expect(next[next.length - 1]).toBe(TAP_WINDOW * 500);
  });
});

describe('useTapTempo', () => {
  // A controllable clock — React/testing-library also call performance.now(), so a
  // call-count-based mock would be consumed by them; drive it from a variable instead.
  let clock = 0;
  beforeEach(() => {
    clock = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
  });
  afterEach(() => vi.restoreAllMocks());

  it('sets bpm from the second tap onward (not the first)', () => {
    const onBpm = vi.fn();
    const { result } = renderHook(() => useTapTempo({ onBpm, spacebarEnabled: false }));
    clock = 0;
    act(() => result.current.tap());
    expect(onBpm).not.toHaveBeenCalled();
    clock = 500;
    act(() => result.current.tap());
    expect(onBpm).toHaveBeenCalledExactlyOnceWith(120);
  });

  it('resets after an idle gap (a lone later tap does not set bpm)', () => {
    const onBpm = vi.fn();
    const { result } = renderHook(() => useTapTempo({ onBpm, spacebarEnabled: false }));
    clock = 0;
    act(() => result.current.tap());
    clock = 500;
    act(() => result.current.tap());
    onBpm.mockClear();
    clock = 500 + TAP_RESET_MS + 1;
    act(() => result.current.tap());
    expect(onBpm).not.toHaveBeenCalled();
  });

  it('taps on spacebar when enabled', () => {
    const onBpm = vi.fn();
    renderHook(() => useTapTempo({ onBpm, spacebarEnabled: true }));
    clock = 0;
    act(() => pressSpace());
    clock = 500;
    act(() => pressSpace());
    expect(onBpm).toHaveBeenCalledWith(120);
  });

  it('ignores spacebar when disabled (e.g. a dialog is open)', () => {
    const onBpm = vi.fn();
    renderHook(() => useTapTempo({ onBpm, spacebarEnabled: false }));
    act(() => pressSpace());
    act(() => pressSpace());
    expect(onBpm).not.toHaveBeenCalled();
  });
});
