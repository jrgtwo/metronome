/**
 * The "nom" beat-eater — a friendly creature that chomps each beat. Placeholder
 * fidelity (a polished character design is a later branding task). Fills use the
 * theme tokens so the mascot tracks whatever palette is active:
 *   body  = --degree-root (amber)   mouth/eyes = --foreground (ink)
 *   whites = --card                 cheek = --degree-third (strawberry)
 * Both marks are decorative (aria-hidden); meaning comes from the wordmark text.
 */

const BODY = 'hsl(var(--degree-root))';
const INK = 'hsl(var(--foreground))';
const WHITE = 'hsl(var(--card))';
const CHEEK = 'hsl(var(--degree-third))';

/** Small mark that sits beside the playful wordmark. */
export function MascotMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill={BODY} />
      {/* open mouth, a wedge taken out toward the beat */}
      <path d="M20 20 38 11a18 18 0 0 1 0 18L20 20Z" fill={INK} />
      <circle cx="15" cy="14" r="2.4" fill={INK} />
    </svg>
  );
}

/** Hero beat-eater for the playful theme's centerpiece. */
export function MascotHero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {/* soft ground shadow */}
      <ellipse cx="60" cy="110" rx="34" ry="6" fill={INK} opacity="0.08" />
      <circle cx="60" cy="64" r="46" fill={BODY} />
      {/* open mouth chomping toward the active beat */}
      <path d="M60 64 100 40 A46 46 0 0 1 100 88 Z" fill={INK} />
      {/* googly eyes */}
      <circle cx="44" cy="42" r="8" fill={WHITE} />
      <circle cx="46" cy="43" r="4" fill={INK} />
      <circle cx="68" cy="40" r="8" fill={WHITE} />
      <circle cx="70" cy="41" r="4" fill={INK} />
      {/* cheek blush */}
      <circle cx="34" cy="74" r="6" fill={CHEEK} opacity="0.5" />
    </svg>
  );
}
