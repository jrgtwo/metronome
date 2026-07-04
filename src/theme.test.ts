import { renderHook, act } from '@testing-library/react';
import { useTheme } from './theme';

const KEY = 'metronomnom.theme';

function htmlClasses(): DOMTokenList {
  return document.documentElement.classList;
}

describe('useTheme (persistence + <html> class)', () => {
  beforeEach(() => {
    localStorage.clear();
    htmlClasses().remove('theme-light', 'theme-dark');
    vi.restoreAllMocks();
  });

  it('initializes from a stored "dark" value', () => {
    localStorage.setItem(KEY, 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(htmlClasses().contains('theme-dark')).toBe(true);
    expect(htmlClasses().contains('theme-light')).toBe(false);
  });

  it('initializes from a stored "light" value', () => {
    localStorage.setItem(KEY, 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(htmlClasses().contains('theme-light')).toBe(true);
  });

  it('falls back to light when nothing is stored', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(htmlClasses().contains('theme-light')).toBe(true);
  });

  it('falls back to light for a garbage stored value', () => {
    localStorage.setItem(KEY, 'chartreuse');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('toggle flips the theme, persists it, and swaps the <html> class', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem(KEY)).toBe('dark');
    expect(htmlClasses().contains('theme-dark')).toBe(true);
    expect(htmlClasses().contains('theme-light')).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem(KEY)).toBe('light');
    expect(htmlClasses().contains('theme-light')).toBe(true);
  });

  it('setTheme sets an explicit value and persists it', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem(KEY)).toBe('dark');
  });

  it('falls back to light when reading localStorage throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    // The read failure is swallowed and the class is still applied.
    expect(htmlClasses().contains('theme-light')).toBe(true);
  });

  it('still applies the class when writing localStorage throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    // If the write failure weren't caught, renderHook would rethrow here.
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe('dark');
    expect(htmlClasses().contains('theme-dark')).toBe(true);
  });
});
