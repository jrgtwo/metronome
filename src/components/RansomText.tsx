import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * The clashing neon palette the ransom letters cycle through. Yellow + cyan are
 * light, so they take ink text; the rest take paper (white).
 */
const RANSOM_PALETTE = [
  { bg: '--rk-pink', dark: false },
  { bg: '--rk-blue', dark: false },
  { bg: '--rk-yellow', dark: true },
  { bg: '--rk-red', dark: false },
  { bg: '--rk-cyan', dark: true },
] as const;

export interface RansomTextProps {
  text: string;
  className?: string;
}

/**
 * Sex-Pistols ransom-note lettering: each character is a clashing neon cut-out box,
 * tilted a few degrees. Both the color and the tilt are derived purely from the
 * character index, so it renders identically every time (no randomness) and unit-
 * tests cleanly. The intact phrase is exposed to assistive tech via `aria-label`;
 * the per-letter boxes are decorative (`aria-hidden`). Size is set by the caller
 * (a `text-*` class on the container).
 */
export function RansomText({ text, className }: RansomTextProps) {
  return (
    <span
      className={cn('inline-flex flex-wrap items-center justify-center gap-1 font-punk uppercase', className)}
      aria-label={text}
    >
      {[...text].map((ch, i) => {
        if (ch === ' ') return <span key={i} aria-hidden style={{ width: '0.3em' }} />;
        const { bg, dark } = RANSOM_PALETTE[i % RANSOM_PALETTE.length];
        const style: CSSProperties = {
          backgroundColor: `hsl(var(${bg}))`,
          color: dark ? 'hsl(var(--rk-ink))' : 'hsl(var(--rk-paper))',
          transform: `rotate(${((i * 37) % 7) - 3}deg)`,
        };
        return (
          <span key={i} aria-hidden className="rock-ransom-ch" style={style}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}
