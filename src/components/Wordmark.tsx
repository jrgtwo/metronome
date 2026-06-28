import { memo } from 'react';
import { MascotMark } from './Mascot';

/**
 * The app wordmark: the beat-eater mark + rounded display type, with the second
 * half ("nomnom") in the brand accent. Colors come from theme tokens, so it
 * adapts to both the light and dark fun themes without branching.
 */
export const Wordmark = memo(function Wordmark() {
  return (
    // The page's single <h1>. Visually it's just the logo + wordmark; the sr-only
    // suffix gives crawlers and screen readers a descriptive heading without a
    // marketing slab on the page. (Tailwind's preflight resets h1 margin/size.)
    <h1 className="flex items-center gap-2">
      <MascotMark className="h-7 w-7 shrink-0" />
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        metro<span className="text-pop">nomnom</span>
      </span>
      <span className="sr-only"> — Free Online Metronome</span>
    </h1>
  );
});
