import { useCallback, useEffect, useState } from 'react';

/**
 * App theming. Two "fun" skins (both playful — mascot, rounded type, 3D
 * controls), differing by light/dark surface, applied over the lib design
 * tokens via the `:root.theme-light` / `:root.theme-dark` blocks in
 * styles/index.css:
 * - `light` — Retro 70s: warm cream, mustard/burnt-orange/avocado. (default)
 * - `dark`  — Warm Dark Playful: dim espresso, amber/strawberry/mint.
 *
 * The active theme is a class on <html> (`theme-light` / `theme-dark`).
 * `index.html` applies the saved/default class before first paint to avoid a
 * flash; this hook keeps it in sync with React state and persists the choice.
 * Keep the storage key + default in sync with the inline script in index.html.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'metronomnom.theme';
const DEFAULT_THEME: Theme = 'light';

function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage may be unavailable (private mode); fall through to default.
  }
  return DEFAULT_THEME;
}

function applyTheme(theme: Theme): void {
  const el = document.documentElement;
  el.classList.toggle('theme-light', theme === 'light');
  el.classList.toggle('theme-dark', theme === 'dark');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore write failures (private mode); the class is still applied.
    }
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    [],
  );

  return { theme, setTheme, toggle };
}
