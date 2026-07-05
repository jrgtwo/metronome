import { renderHook, act } from '@testing-library/react';
import { useCenterpieceView } from './centerpieceView';

const KEY = 'metronomnom.centerpiece';

describe('useCenterpieceView (persisted dots/mascot choice)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to dots when nothing is stored', () => {
    const { result } = renderHook(() => useCenterpieceView());
    expect(result.current.view).toBe('dots');
  });

  it('restores a stored "mascot" choice', () => {
    localStorage.setItem(KEY, 'mascot');
    const { result } = renderHook(() => useCenterpieceView());
    expect(result.current.view).toBe('mascot');
  });

  it('falls back to dots for a garbage stored value', () => {
    localStorage.setItem(KEY, 'wobble');
    const { result } = renderHook(() => useCenterpieceView());
    expect(result.current.view).toBe('dots');
  });

  it('toggle flips the view and persists it', () => {
    const { result } = renderHook(() => useCenterpieceView());
    act(() => result.current.toggle());
    expect(result.current.view).toBe('mascot');
    expect(localStorage.getItem(KEY)).toBe('mascot');

    act(() => result.current.toggle());
    expect(result.current.view).toBe('dots');
    expect(localStorage.getItem(KEY)).toBe('dots');
  });

  it('falls back to dots when reading localStorage throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const { result } = renderHook(() => useCenterpieceView());
    expect(result.current.view).toBe('dots');
  });

  it('still updates state when writing localStorage throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    const { result } = renderHook(() => useCenterpieceView());
    act(() => result.current.toggle());
    expect(result.current.view).toBe('mascot');
  });
});
