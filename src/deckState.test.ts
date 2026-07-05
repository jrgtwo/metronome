import { renderHook, act } from '@testing-library/react';
import { useDeckExpanded } from './deckState';

const KEY = 'metronomnom.deck';

describe('useDeckExpanded (persisted collapse state)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to collapsed when nothing is stored', () => {
    const { result } = renderHook(() => useDeckExpanded());
    expect(result.current.expanded).toBe(false);
  });

  it('restores a stored open state', () => {
    localStorage.setItem(KEY, 'open');
    const { result } = renderHook(() => useDeckExpanded());
    expect(result.current.expanded).toBe(true);
  });

  it('stays collapsed for a garbage stored value', () => {
    localStorage.setItem(KEY, 'huh');
    const { result } = renderHook(() => useDeckExpanded());
    expect(result.current.expanded).toBe(false);
  });

  it('toggle flips the state and persists it', () => {
    const { result } = renderHook(() => useDeckExpanded());
    act(() => result.current.toggle());
    expect(result.current.expanded).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('open');

    act(() => result.current.toggle());
    expect(result.current.expanded).toBe(false);
    expect(localStorage.getItem(KEY)).toBe('closed');
  });

  it('falls back to collapsed when reading localStorage throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const { result } = renderHook(() => useDeckExpanded());
    expect(result.current.expanded).toBe(false);
  });

  it('still updates state when writing localStorage throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    const { result } = renderHook(() => useDeckExpanded());
    act(() => result.current.toggle());
    expect(result.current.expanded).toBe(true);
  });
});
