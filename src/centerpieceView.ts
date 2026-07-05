import { useCallback, useEffect, useState } from 'react';

/**
 * Which element the centerpiece shows — the two are mutually exclusive:
 * - `dots`   — the beat-dots arc over the BPM number (default).
 * - `mascot` — the BPM number with the beat-eating mascot below it.
 *
 * A view preference (not part of the musical setup), so it persists to localStorage
 * like the theme — but React-only (no <html> class / pre-paint script).
 */
export type CenterpieceView = 'dots' | 'mascot';

const STORAGE_KEY = 'metronomnom.centerpiece';
const DEFAULT_VIEW: CenterpieceView = 'dots';

function readStoredView(): CenterpieceView {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dots' || saved === 'mascot') return saved;
  } catch {
    // localStorage may be unavailable (private mode); fall through to default.
  }
  return DEFAULT_VIEW;
}

export function useCenterpieceView() {
  const [view, setView] = useState<CenterpieceView>(readStoredView);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch {
      // Ignore write failures (private mode); the choice still applies this session.
    }
  }, [view]);

  const toggle = useCallback(
    () => setView((v) => (v === 'dots' ? 'mascot' : 'dots')),
    [],
  );

  return { view, setView, toggle };
}
