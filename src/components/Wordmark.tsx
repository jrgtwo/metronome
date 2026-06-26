import { MascotMark } from './Mascot';

/**
 * The app wordmark: the beat-eater mark + rounded display type, with the second
 * half ("nomnom") in the brand accent. Colors come from theme tokens, so it
 * adapts to both the light and dark fun themes without branching.
 */
export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <MascotMark className="h-7 w-7 shrink-0" />
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        metro<span className="text-degree-third">nomnom</span>
      </span>
    </span>
  );
}
