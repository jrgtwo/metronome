import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { SubdivisionId } from '@fretwork/lib';
import type { Act } from '../rockMode';
import { BeatDots } from './BeatDots';
import { TempoReadout } from './BpmControl';
import { RockstarMascot } from './RockstarMascot';
import { RansomText } from './RansomText';

export interface RockModeProps {
  act: Act;
  /** Beats remaining in the count-in. */
  countdown: number;
  go: boolean;
  /** Climb progress toward the target, 0..1. */
  progress: number;
  /** Bumps on each BPM step — keys the LEVEL UP flare so it re-animates. */
  levelUpKey: number;
  bpm: number;
  target: number;
  step: number;
  /** BPM the climb started from (the meter's left end). */
  startBpm: number | null;
  /** Bars until the next bump; `null` hides the marquee. */
  barsUntilNext: number | null;
  // The real metronome, reused verbatim (see BeatDots).
  beats: number;
  accents: readonly number[];
  accentEnabled: boolean;
  currentBeat: number;
  subdivision: SubdivisionId;
  currentSubdivisionIndex: number;
  isRunning: boolean;
  /** Stop playback (closes the show, stays armed). */
  onStop: () => void;
  /** Bail out (stop + disarm). */
  onExit: () => void;
}

/**
 * The Rock Mode overlay — a full-screen punk/glam concert framing the tempo trainer
 * (Bowie lightning bolts, comic speed-lines, Sex-Pistols ransom lettering, a shredding
 * mascot). It never redraws the metronome: the climb reuses the real `BeatDots` +
 * `TempoReadout`, sitting in a lit "spotlight pool" so they stay legible on the dark
 * stage in either theme. The launch count-in and victory payoff are brief dramatic
 * full screens.
 *
 * Fully presentational: all state (the act, progress, level-up key) arrives as props
 * from `useRockMode`, so it unit-tests without the engine.
 */
export function RockMode(props: RockModeProps) {
  const { act, onExit } = props;

  // Escape bails out of the show (the overlay covers the whole screen).
  useEffect(() => {
    if (act === 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, onExit]);

  if (act === 'idle' || act === 'done') return null;
  if (act === 'launch') return <LaunchCountdown countdown={props.countdown} go={props.go} />;
  if (act === 'victory')
    return (
      <VictoryScreen
        target={props.target}
        startBpm={props.startBpm}
        bpm={props.bpm}
        isRunning={props.isRunning}
        currentBeat={props.currentBeat}
        beats={props.beats}
      />
    );
  return <ConcertHud {...props} />;
}

/** The shared stage dressing behind every act: ink backdrop, spinning comic
 *  speed-lines, halftone texture, and the two Bowie lightning bolts. */
function StageFX() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="rock-stage absolute inset-0" />
      <div className="rock-speed animate-rock-spin" />
      <div className="rock-speed-alt animate-rock-spin-rev" />
      <div className="rock-halftone absolute inset-0" />
      <Bolt side="l" />
      <Bolt side="r" />
    </div>
  );
}

/** A Bowie/Ziggy lightning bolt down one edge of the stage, pulsing on the beat. */
function Bolt({ side }: { side: 'l' | 'r' }) {
  const style =
    side === 'l'
      ? { left: '-14px', top: '8%', color: 'hsl(var(--rk-blue))', transform: 'rotate(-8deg)' }
      : { right: '-10px', bottom: '14%', color: 'hsl(var(--rk-red))', transform: 'rotate(8deg) scaleX(-1)' };
  return (
    <div
      className="animate-rock-boltpulse absolute w-28"
      style={{ ...style, filter: 'drop-shadow(0 0 12px currentColor)' }}
      aria-hidden
    >
      <svg viewBox="0 0 60 160" fill="currentColor" className="block h-auto w-full">
        <polygon points="34,0 6,92 26,92 14,160 54,58 30,58 44,0" />
      </svg>
    </div>
  );
}

/** Act 1 — the beat-synced race-start count-in, punk poster type. */
function LaunchCountdown({ countdown, go }: { countdown: number; go: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6">
      <StageFX />
      <p
        className="relative z-10 font-punk text-3xl uppercase tracking-label-sm text-rk-paper"
        style={{ textShadow: '3px 3px 0 hsl(var(--rk-pink))' }}
      >
        Get ready
      </p>
      {go ? (
        <span key="go" className="rock-count-go animate-rock-go relative z-10 font-punk text-9xl leading-none">
          GO!
        </span>
      ) : (
        <span
          key={countdown}
          className="rock-count animate-rock-count relative z-10 font-punk text-9xl leading-none"
        >
          {countdown}
        </span>
      )}
    </div>
  );
}

/** Act 3 — the victory payoff: the mascot shreds, ransom title, big final BPM, confetti. */
function VictoryScreen({
  target,
  startBpm,
  bpm,
  isRunning,
  currentBeat,
  beats,
}: {
  target: number;
  startBpm: number | null;
  bpm: number;
  isRunning: boolean;
  currentBeat: number;
  beats: number;
}) {
  const gained = startBpm !== null ? target - startBpm : null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-hidden text-center">
      <StageFX />
      <RansomText text="You shredded it" className="relative z-10 max-w-arc text-4xl" />
      <RockstarMascot
        bpm={bpm}
        isRunning={isRunning}
        currentBeat={currentBeat}
        beats={beats}
        className="relative z-10 w-52 drop-shadow-2xl"
      />
      <span className="rock-victory-num animate-rock-victory relative z-10 font-punk text-8xl leading-none">
        {target}
      </span>
      <p className="relative z-10 font-punk text-lg uppercase tracking-label-sm text-rk-yellow">
        Target smashed{gained !== null ? ` · +${gained} BPM` : ''}
      </p>
      <Confetti />
    </div>
  );
}

/** Act 2 — the climb HUD framing the real metronome, with the mascot performing stage-left. */
function ConcertHud(props: RockModeProps) {
  const { progress, levelUpKey, bpm, target, step, startBpm, barsUntilNext } = props;
  const pct = Math.round(progress * 100);
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <StageFX />

      {/* top bar: ON AIR + bail-out */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <span className="flex items-center gap-2 font-punk text-lg uppercase tracking-label-sm text-rk-paper">
          <span
            aria-hidden
            className="animate-rock-pulse h-2.5 w-2.5 rounded-full bg-rk-red"
            style={{ boxShadow: '0 0 14px hsl(var(--rk-red))' }}
          />
          On air
        </span>
        <button
          type="button"
          onClick={props.onExit}
          aria-label="Exit Rock Mode"
          className="grid h-10 w-10 place-items-center rounded-full border-2 border-rk-paper text-rk-paper transition-colors hover:bg-rk-paper/15"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* the real metronome (untouched) in a lit spotlight pool, mascot performing stage-left */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="rock-pool absolute left-1/2 top-1/2 h-72 w-80 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative w-full max-w-arc">
          <BeatDots
            beats={props.beats}
            accents={props.accents}
            accentEnabled={props.accentEnabled}
            currentBeat={props.currentBeat}
            subdivision={props.subdivision}
            currentSubdivisionIndex={props.currentSubdivisionIndex}
            isRunning={props.isRunning}
          >
            <TempoReadout bpm={bpm} large />
          </BeatDots>
        </div>
        <RockstarMascot
          bpm={bpm}
          isRunning={props.isRunning}
          currentBeat={props.currentBeat}
          beats={props.beats}
          className="pointer-events-none absolute bottom-0 left-0 z-10 w-36 drop-shadow-2xl"
        />
      </div>

      {/* LEVEL UP ransom flare — its own reserved band below the metronome. Only
          rendered after an actual bump, and `opacity-0` at rest so it flashes on the
          milestone then vanishes (the animation has no forwards fill). Re-keyed per
          bump to re-fire. */}
      <div className="relative z-10 flex h-12 items-center justify-center">
        {levelUpKey > 0 && (
          <span
            key={levelUpKey}
            data-testid="levelup-flare"
            data-key={levelUpKey}
            className="animate-rock-flare pointer-events-none inline-block opacity-0"
          >
            <RansomText text={`Level up +${step}`} className="text-xl" />
          </span>
        )}
      </div>

      {/* amp-gain meter: start → target */}
      <div className="relative z-10 px-6">
        <div className="mb-1.5 flex justify-between font-punk text-sm uppercase tracking-label-sm text-rk-paper">
          <span>
            Start <b className="text-rk-cyan">{startBpm ?? bpm}</b>
          </span>
          <span>
            Target <b className="text-rk-pink">{target}</b>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Tempo climb"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="rock-meter h-5 overflow-hidden rounded-md"
        >
          <div className="rock-meter-fill h-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* next-bump marquee */}
      <div className="relative z-10 flex justify-center pt-4">
        {barsUntilNext !== null && (
          <span className="rock-marquee -rotate-1 px-4 py-2 font-punk text-lg uppercase tracking-label-sm">
            +{step} BPM in {barsUntilNext} {barsUntilNext === 1 ? 'bar' : 'bars'}
          </span>
        )}
      </div>

      {/* stop */}
      <div className="relative z-10 flex justify-center px-6 pb-8 pt-4">
        <button
          type="button"
          onClick={props.onStop}
          className="rock-stop -rotate-1 px-14 py-3 font-punk text-2xl uppercase tracking-label-sm transition-transform active:translate-x-px active:translate-y-1"
        >
          Stop
        </button>
      </div>
    </div>
  );
}

// Deterministic confetti (no randomness → stable render + tests). Each piece's
// column, color, fall duration, and delay come from its index.
const RK_CONFETTI_COLORS = ['--rk-pink', '--rk-blue', '--rk-yellow', '--rk-red', '--rk-cyan'];
const CONFETTI = Array.from({ length: 60 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  color: `hsl(var(${RK_CONFETTI_COLORS[i % RK_CONFETTI_COLORS.length]}))`,
  duration: `${1800 + ((i * 53) % 1600)}ms`,
  delay: `${(i * 29) % 500}ms`,
}));

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="animate-rock-fall absolute"
          style={{
            top: '-24px',
            left: c.left,
            width: '10px',
            height: '18px',
            backgroundColor: c.color,
            animationDuration: c.duration,
            animationDelay: c.delay,
          }}
        />
      ))}
    </div>
  );
}
