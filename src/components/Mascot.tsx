import { useEffect, useId, useMemo, useRef } from 'react';
import type { Ref } from 'react';
import { subdivisionCount } from '@fretwork/lib';
import type { SubdivisionId } from '@fretwork/lib';
import {
  SP,
  X_MOUTH,
  Y_FOOT,
  Y_MOUTH,
  BODY_AMP,
  BODY_BOB,
  conveyorTranslate,
  pendulumAngle,
  bodySway,
  bodyOffset,
  bodyBob,
  bodyPath,
} from './mascotAnim';

/**
 * The "nom" mascot — a wind-up metronome eating notes off a staff.
 *   - <MascotMark>  the bare metronome, for the header wordmark (small, static).
 *   - <MascotHero>  the metronome + a live staff of notes, PHASE-LOCKED to the
 *     engine's beat clock (the same `currentBeat`/`currentSubdivisionIndex` that
 *     drives BeatDots): the pendulum is at an extreme on every beat (far left on
 *     beat 1), and each note reaches the metronome exactly on its tick.
 *
 * One rAF loop interpolates between tick timestamps to drive both the pendulum
 * rotation and the note conveyor. Colors come from theme tokens; `BODY_D` is a
 * fixed mid-amber used only for on-body shading (reads on either surface).
 */
const BODY = 'hsl(var(--degree-root))'; // metronome body + beat notes (amber / mustard)
const BODY_D = 'hsl(38 60% 46%)'; // base, pendulum — on-body shading
const BEAT = 'hsl(var(--degree-third))'; // accent notes / blush (strawberry / burnt orange)
const DARK = 'hsl(var(--primary-foreground))'; // mouth + pupils (dark in both themes)
const STAFF = 'hsl(var(--muted-foreground))'; // staff lines

const CLIP_X = 56; // notes are clipped (hidden) left of here
// SP / X_MOUTH and the phase math live in ./mascotAnim (pure + unit-tested).

interface NoteProps {
  x: number;
  y: number;
  s?: number;
  color?: string;
  opacity?: number;
}

/** A small eighth-note (notehead + stem). */
function Note({ x, y, s = 1, color = BEAT, opacity = 1 }: NoteProps) {
  return (
    <g opacity={opacity}>
      <ellipse cx={x} cy={y} rx={5.4 * s} ry={4.3 * s} transform={`rotate(-18 ${x} ${y})`} fill={color} />
      <rect x={x + 3.7 * s} y={y - 15 * s} width={2 * s} height={13 * s} rx={1} fill={color} />
    </g>
  );
}

/** Pendulum (rod + weight). When `pendulumRef` is set the parent drives its
 *  rotation; otherwise it rests upright (the static header mark). */
function Pendulum({ pendulumRef }: { pendulumRef?: Ref<SVGGElement> }) {
  return (
    <g ref={pendulumRef}>
      <line x1="50" y1="80" x2="50" y2="16" stroke={BODY_D} strokeWidth="3" strokeLinecap="round" />
      <rect x="44.5" y="40" width="11" height="8" rx="2" fill={BEAT} />
    </g>
  );
}

/** The authored upright-body silhouette (used by the static header mark). */
const REST_BODY_D = 'M30 86 L39 33 Q40 28 45 28 L55 28 Q60 28 61 33 L70 86 Z';

interface MetronomeRefs {
  pendulumRef?: Ref<SVGGElement>;
  /** Hero only: parent drives the body bend, face/base offset (the "hula" sway).
   *  When unset (the header mark) the body is the static authored path. */
  bodyRef?: Ref<SVGPathElement>;
  faceRef?: Ref<SVGGElement>;
  baseRef?: Ref<SVGRectElement>;
}

/** The classic upright metronome, centered in a 100×100 box. */
function Metronome({ pendulumRef, bodyRef, faceRef, baseRef }: MetronomeRefs) {
  return (
    <>
      <rect ref={baseRef} x="24" y="84" width="52" height="9" rx="4.5" fill={BODY_D} />
      <path ref={bodyRef} d={bodyRef ? bodyPath(0, BODY_AMP) : REST_BODY_D} fill={BODY} />
      <Pendulum pendulumRef={pendulumRef} />
      <g ref={faceRef}>
        <circle cx="44" cy="58" r="5" fill="#fff" />
        <circle cx="45.2" cy="59" r="2.5" fill={DARK} />
        <circle cx="56" cy="58" r="5" fill="#fff" />
        <circle cx="57.2" cy="59" r="2.5" fill={DARK} />
        <path d="M42 69 Q50 80 58 69 Q50 74 42 69 Z" fill={DARK} />
        <circle cx="40" cy="66" r="3" fill={BEAT} opacity="0.4" />
        <circle cx="60" cy="66" r="3" fill={BEAT} opacity="0.4" />
      </g>
    </>
  );
}

/** Header mark: just the metronome (the staff is unreadable at this size). */
export function MascotMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <Metronome />
    </svg>
  );
}

type ItemKind = 'accent' | 'main' | 'sub';

const STYLE_BY_KIND: Record<ItemKind, { y: number; s: number; color: string; opacity?: number }> = {
  accent: { y: 68, s: 0.92, color: BEAT },
  main: { y: 72, s: 0.76, color: BODY },
  sub: { y: 75, s: 0.52, color: BODY, opacity: 0.6 },
};

interface MascotHeroProps {
  bpm?: number;
  isRunning?: boolean;
  beats?: number;
  accents?: readonly number[];
  accentEnabled?: boolean;
  subdivision?: SubdivisionId;
  /** Engine beat clock — drives phase-lock with BeatDots. */
  currentBeat?: number;
  currentSubdivisionIndex?: number;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Centerpiece: the metronome eating a meter/feel-derived stream of notes,
 *  phase-locked to the beat clock. */
export function MascotHero({
  bpm = 0,
  isRunning = false,
  beats = 4,
  accents = [],
  accentEnabled = true,
  subdivision,
  currentBeat = -1,
  currentSubdivisionIndex = 0,
  className,
}: MascotHeroProps) {
  const subsPerBeat = subdivision ? subdivisionCount(subdivision) : 1;
  const accentKey = accents.join(',');

  // One measure of notes (mirrors BeatDots), repeated enough to fill + loop.
  const { items, patternWidth, copies } = useMemo(() => {
    const its: ItemKind[] = [];
    for (let b = 0; b < beats; b++) {
      its.push(accentEnabled && accents.includes(b) ? 'accent' : 'main');
      for (let s = 1; s < subsPerBeat; s++) its.push('sub');
    }
    const pw = Math.max(1, its.length) * SP;
    return { items: its, patternWidth: pw, copies: Math.max(2, Math.ceil((138 - X_MOUTH) / pw) + 1) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beats, subsPerBeat, accentEnabled, accentKey]);

  const conveyorRef = useRef<SVGGElement>(null);
  const pendulumRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const baseRef = useRef<SVGRectElement>(null);
  const rootRef = useRef<SVGGElement>(null);
  const clipId = useId();

  // Latest engine position (read by the rAF loop without restarting it) +
  // a monotonic beat counter (so the pendulum alternates across bar lines).
  const beatPosRef = useRef(-1);
  const subPosRef = useRef(0);
  const monotonicBeatRef = useRef(0);
  const prevBeatRef = useRef(-1);
  const tickTimeRef = useRef(0);

  // Track ground truth: mirror the current position into refs, advance the
  // monotonic beat on beat changes, and stamp the tick time for interpolation.
  useEffect(() => {
    beatPosRef.current = currentBeat;
    subPosRef.current = currentSubdivisionIndex;
    if (!isRunning || currentBeat < 0) {
      monotonicBeatRef.current = 0;
      prevBeatRef.current = -1;
      return;
    }
    if (currentBeat !== prevBeatRef.current) {
      if (prevBeatRef.current < 0) {
        monotonicBeatRef.current = 0; // first beat → far left
      } else {
        let d = currentBeat - prevBeatRef.current;
        if (d < 0) d += Math.max(1, beats); // wrapped into the next measure
        monotonicBeatRef.current += d;
      }
      prevBeatRef.current = currentBeat;
    }
    tickTimeRef.current = performance.now();
  }, [currentBeat, currentSubdivisionIndex, isRunning, beats]);

  // Drive both from the CURRENT position each frame — no accumulation, so tempo
  // / meter / feel changes re-anchor immediately (like BeatDots).
  useEffect(() => {
    // `sway` is passed in (not derived from monoBeat) so rest can sit the body
    // upright (sway 0) while the pendulum still rests at its far-left extreme.
    const draw = (inMeasureTick: number, monoBeat: number, sub: number, frac: number, sway: number) => {
      conveyorRef.current?.setAttribute(
        'transform',
        `translate(${conveyorTranslate(inMeasureTick, frac, patternWidth).toFixed(3)} 0)`,
      );
      // Pendulum keeps ONLY its own tick — it is not carried by the body sway.
      pendulumRef.current?.setAttribute(
        'transform',
        `rotate(${pendulumAngle(monoBeat, sub, frac, subsPerBeat).toFixed(3)} 50 80)`,
      );
      // Hula body sway: bend the body, keep feet + mouth ~planted, hop on each side.
      bodyRef.current?.setAttribute('d', bodyPath(sway, BODY_AMP));
      faceRef.current?.setAttribute('transform', `translate(${bodyOffset(Y_MOUTH, sway, BODY_AMP).toFixed(3)} 0)`);
      baseRef.current?.setAttribute('transform', `translate(${bodyOffset(Y_FOOT, sway, BODY_AMP).toFixed(3)} 0)`);
      rootRef.current?.setAttribute('transform', `translate(0 ${bodyBob(sway, BODY_BOB).toFixed(3)})`);
    };

    if (!isRunning || bpm <= 0 || prefersReducedMotion()) {
      draw(0, 0, 0, 0, 0); // rest: note 0 at the mouth, pendulum far left, body upright
      return;
    }
    const tickMs = 60000 / bpm / subsPerBeat;
    let raf = 0;
    const frame = (now: number) => {
      const frac = Math.min(1, Math.max(0, (now - tickTimeRef.current) / tickMs));
      const sub = Math.max(0, subPosRef.current);
      const inMeasureTick = Math.max(0, beatPosRef.current) * subsPerBeat + sub;
      const sway = bodySway(monotonicBeatRef.current, sub, frac, subsPerBeat);
      draw(inMeasureTick, monotonicBeatRef.current, sub, frac, sway);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isRunning, bpm, subsPerBeat, patternWidth]);

  return (
    <svg viewBox="0 0 138 100" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x={CLIP_X} y="54" width={138 - CLIP_X} height="42" />
        </clipPath>
      </defs>
      <line x1="68" y1="64" x2="130" y2="64" stroke={STAFF} strokeWidth="1.4" />
      <line x1="68" y1="72" x2="130" y2="72" stroke={STAFF} strokeWidth="1.4" />
      <line x1="68" y1="80" x2="130" y2="80" stroke={STAFF} strokeWidth="1.4" />
      <g clipPath={`url(#${clipId})`}>
        <g ref={conveyorRef}>
          {Array.from({ length: copies }).flatMap((_, c) =>
            items.map((kind, i) => {
              const st = STYLE_BY_KIND[kind];
              return (
                <Note
                  key={`${c}-${i}`}
                  x={X_MOUTH + (c * items.length + i) * SP}
                  y={st.y}
                  s={st.s}
                  color={st.color}
                  opacity={st.opacity}
                />
              );
            }),
          )}
        </g>
      </g>
      <g ref={rootRef}>
        <Metronome pendulumRef={pendulumRef} bodyRef={bodyRef} faceRef={faceRef} baseRef={baseRef} />
      </g>
    </svg>
  );
}
