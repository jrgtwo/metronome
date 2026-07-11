import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * The "nom" mascot dressed to shred: it's the same wind-up metronome character as
 * `Mascot.tsx` (dome body, blush-cheeked face, swinging pendulum) kitted out for
 * Rock Mode — a flying-V guitar held low so the face stays clear, a Bowie/Ziggy
 * lightning bolt over one eye, a punk mohawk, and an open shout. It headbangs,
 * swings its pendulum, and strums in time with the beat.
 *
 * Purely decorative (`aria-hidden`) — the *real* metronome (BeatDots) is the timing
 * reference in Rock Mode; this just performs. Motion is CSS (`animate-rock-*`) paced
 * off the live BPM via inline `animationDuration`, and disabled at rest / under
 * reduced-motion. All colors are app-owned tokens; the amber body reads on the dark
 * stage and in the light theme's spotlight pool alike.
 */
export interface RockstarMascotProps {
  bpm: number;
  isRunning: boolean;
  className?: string;
}

// The metronome character's own palette (matches Mascot.tsx) + the rock neon accents.
const BODY = 'hsl(var(--primary))';
const WOOD = 'hsl(var(--wood))';
const EYE = 'hsl(var(--mascot-eye))';
const DARK = 'hsl(var(--primary-foreground))';
const OUTLINE = 'hsl(var(--rk-outline))';
const PAPER = 'hsl(var(--rk-paper))';
const PINK = 'hsl(var(--rk-pink))';
const CYAN = 'hsl(var(--rk-cyan))';
const YELLOW = 'hsl(var(--rk-yellow))';
const RED = 'hsl(var(--rk-red))';

export function RockstarMascot({ bpm, isRunning, className }: RockstarMascotProps) {
  const gid = useId();
  const boltFill = `url(#bolt-${gid})`;
  const neckFill = `url(#neck-${gid})`;

  // Beat-paced motion: one full headbang / pendulum swing per two beats, one strum
  // per beat. Durations are set inline so the show tracks the live tempo.
  const beatMs = bpm > 0 ? 60000 / bpm : 500;
  const twoBeat = `${Math.round(2 * beatMs)}ms`;
  const oneBeat = `${Math.round(beatMs)}ms`;

  // Animations run only while playing (reduced-motion is handled in index.css).
  const bodyAnim = isRunning ? 'animate-rock-headbang' : undefined;
  const pendAnim = isRunning ? 'animate-rock-swing' : undefined;
  const strumAnim = isRunning ? 'animate-rock-strum' : undefined;

  return (
    <svg
      viewBox="0 0 160 150"
      data-testid="rockstar-mascot"
      aria-hidden="true"
      className={cn('block overflow-visible', className)}
    >
      <defs>
        <linearGradient id={`bolt-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="hsl(var(--rk-blue))" />
          <stop offset="1" stopColor={RED} />
        </linearGradient>
        <linearGradient id={`neck-${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={CYAN} />
          <stop offset="1" stopColor="hsl(var(--rk-blue))" />
        </linearGradient>
      </defs>

      {/* Whole-body headbang: pivots at the planted base. */}
      <g
        className={bodyAnim}
        style={{ transformBox: 'view-box', transformOrigin: '80px 131px', animationDuration: twoBeat }}
      >
        {/* base + dome body */}
        <rect x="42" y="118" width="76" height="13" rx="6.5" fill={WOOD} />
        <path d="M47 122 L60 45 Q61.5 38 69 38 L91 38 Q98.5 38 100 45 L113 122 Z" fill={BODY} />

        {/* pendulum — swings from the BASE (like a real metronome), weight up top */}
        <g
          className={pendAnim}
          style={{ transformBox: 'view-box', transformOrigin: '80px 112px', animationDuration: twoBeat }}
        >
          <line x1="80" y1="112" x2="80" y2="26" stroke={WOOD} strokeWidth="4.4" strokeLinecap="round" />
          <rect x="72" y="40" width="16" height="11" rx="3" fill={RED} />
        </g>

        {/* punk mohawk along the dome crown */}
        <g stroke={OUTLINE} strokeWidth="1">
          <path d="M71 40 L74 25 L79 40 Z" fill={PINK} />
          <path d="M78 39 L82 21 L87 39 Z" fill={CYAN} />
          <path d="M86 40 L90 27 L95 41 Z" fill={YELLOW} />
        </g>

        {/* face (up on the dome, clear above the low-slung guitar) */}
        <circle cx="72" cy="64" r="7" fill={EYE} />
        <circle cx="73.8" cy="65.5" r="3.5" fill={DARK} />
        <circle cx="90" cy="64" r="7" fill={EYE} />
        <circle cx="91.8" cy="65.5" r="3.5" fill={DARK} />
        {/* Bowie/Ziggy lightning bolt across the right eye */}
        <path
          d="M98 42 L84 64 L92 64 L82 88 L104 58 L95 58 L104 42 Z"
          fill={boltFill}
          stroke={OUTLINE}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* blush */}
        <circle cx="66" cy="75" r="4" fill={PINK} opacity="0.5" />
        <circle cx="96" cy="76" r="4" fill={PINK} opacity="0.5" />
        {/* open rock-shout mouth */}
        <g transform="rotate(-4 82 82)">
          <ellipse cx="82" cy="82" rx="8" ry="6" fill={DARK} />
          <path d="M75 80 h14" stroke={PAPER} strokeWidth="1.9" />
          <ellipse cx="82" cy="85" rx="4" ry="2.8" fill={RED} />
        </g>

        {/* flying-V guitar held low: neck out to the left, body low-right, face clear.
            Outer group places it; inner group carries the strum so CSS never fights
            the placement transform. */}
        <g transform="translate(82 112) rotate(-68) scale(.8)">
          <g
            className={strumAnim}
            style={{ transformBox: 'fill-box', transformOrigin: '60% 26%', animationDuration: oneBeat }}
          >
            <rect x="-5" y="-62" width="10" height="54" rx="3" fill={neckFill} stroke={OUTLINE} strokeWidth="1.6" />
            <path d="M-8 -78 L8 -78 L7 -60 L-7 -60 Z" fill={YELLOW} stroke={OUTLINE} strokeWidth="1.6" />
            <circle cx="-4" cy="-74" r="1.4" fill={OUTLINE} />
            <circle cx="4" cy="-74" r="1.4" fill={OUTLINE} />
            <circle cx="-4" cy="-67" r="1.4" fill={OUTLINE} />
            <circle cx="4" cy="-67" r="1.4" fill={OUTLINE} />
            <line x1="-2.2" y1="-76" x2="-2.2" y2="30" stroke={PAPER} strokeWidth=".9" opacity=".6" />
            <line x1="2.2" y1="-76" x2="2.2" y2="30" stroke={PAPER} strokeWidth=".9" opacity=".6" />
            <path
              d="M-11 -12 L11 -12 L25 40 L7 28 L0 9 L-7 28 L-25 40 Z"
              fill={PINK}
              stroke={OUTLINE}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M-8 -8 L8 -8 L4 8 L-4 8 Z" fill={YELLOW} stroke={OUTLINE} strokeWidth="1.8" />
            <rect x="-6" y="-5" width="12" height="3.4" rx="1" fill={OUTLINE} />
            <rect x="-6" y="1" width="12" height="3.4" rx="1" fill={OUTLINE} />
          </g>
        </g>
        {/* little hands (fretting on the neck at left, strumming at the body on the right) */}
        <circle cx="52" cy="101" r="6.5" fill={BODY} stroke={OUTLINE} strokeWidth="1.8" />
        <circle cx="96" cy="112" r="6.5" fill={BODY} stroke={OUTLINE} strokeWidth="1.8" />
      </g>
    </svg>
  );
}
