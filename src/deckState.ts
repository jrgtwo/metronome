import { useCallback, useEffect, useState } from 'react';

/**
 * Whether the control deck is expanded (meter/feel/swing revealed) or collapsed
 * (tempo only). A view preference, persisted like the theme — React-only, so a
 * stored value applies on first render. Default collapsed.
 */
const STORAGE_KEY = 'metronomnom.deck';

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'open';
  } catch {
    // localStorage may be unavailable (private mode); default collapsed.
    return false;
  }
}

export function useDeckExpanded() {
  const [expanded, setExpanded] = useState<boolean>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, expanded ? 'open' : 'closed');
    } catch {
      // Ignore write failures (private mode); the choice still applies this session.
    }
  }, [expanded]);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return { expanded, setExpanded, toggle };
}
