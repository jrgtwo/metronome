import { useEffect } from 'react';
import { X, Square, ChevronsUp, Zap } from 'lucide-react';
import type { SubdivisionId } from '@fretwork/lib';
import type { Act } from '../rockMode';
import { BeatDots } from './BeatDots';
import { TempoReadout } from './BpmControl';

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
 * The Rock Mode overlay — a full-screen concert framing the tempo trainer. It never
 * redraws the metronome: the climb reuses the real `BeatDots` + `TempoReadout` on the
 * app background, dressed with stage glow, a `LIVE` badge, the amp-gain meter, the
 * next-bump marquee, and STOP. The launch count-in and the victory payoff are brief
 * dramatic full screens (the dark `--stage`) with no live metronome on them.
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
    return <VictoryScreen target={props.target} startBpm={props.startBpm} />;
  return <ConcertHud {...props} />;
}

/** Act 1 — the beat-synced race-start count-in. */
function LaunchCountdown({ countdown, go }: { countdown: number; go: boolean }) {
  return (
    <div className="rock-scrim fixed inset-0 z-50 flex flex-col items-center justify-center gap-3">
      <p className="font-display text-xl font-semibold uppercase tracking-label-sm text-stage-foreground/75">
        Get ready
      </p>
      {go ? (
        <span key="go" className="rock-glow-pop animate-rock-go font-display text-9xl font-bold text-pop">
          GO!
        </span>
      ) : (
        <span
          key={countdown}
          className="rock-glow-spot animate-rock-count font-display text-9xl font-bold leading-none text-spotlight"
        >
          {countdown}
        </span>
      )}
    </div>
  );
}

/** Act 3 — the victory payoff. */
function VictoryScreen({ target, startBpm }: { target: number; startBpm: number | null }) {
  const gained = startBpm !== null ? target - startBpm : null;
  return (
    <div className="rock-scrim rock-scrim-hot fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 text-center">
      <p className="animate-rock-victory font-display text-5xl font-bold leading-tight text-stage-foreground">
        You
        <br />
        shredded it!
      </p>
      <span className="font-display text-8xl font-bold leading-none text-spotlight">{target}</span>
      <p className="font-display text-xl font-semibold uppercase tracking-label-sm text-pop">
        Target smashed{gained !== null ? ` · +${gained} BPM` : ''}
      </p>
    </div>
  );
}

/** Act 2 — the climb HUD framing the real metronome. */
function ConcertHud(props: RockModeProps) {
  const { progress, levelUpKey, bpm, target, step, startBpm, barsUntilNext } = props;
  const pct = Math.round(progress * 100);
  return (
    <div className="rock-stage fixed inset-0 z-50 flex flex-col">
      {/* stage energy layered on the real app background (metronome stays legible) */}
      <div className="rock-beam rock-beam-l" aria-hidden />
      <div className="rock-beam rock-beam-r" aria-hidden />
      <div className="rock-halo" aria-hidden style={{ opacity: 0.45 + progress * 0.5 }} />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <span className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-label-sm text-pop">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-pop shadow-glow-pop" aria-hidden />
          Live
        </span>
        <button
          type="button"
          onClick={props.onExit}
          aria-label="Exit Rock Mode"
          className="grid h-10 w-10 place-items-center rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-foreground/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* the real metronome, untouched */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="w-full max-w-arc">
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
      </div>

      {/* LEVEL UP flare — its own reserved band below the metronome (so it never
          overlaps the beat pills or the BPM number). Only rendered after an actual
          bump, and `opacity-0` at rest so it flashes on the milestone then vanishes
          (the animation has no forwards fill-mode). Re-keyed per bump to re-fire. */}
      <div className="relative z-10 h-10">
        {levelUpKey > 0 && (
          <span
            key={levelUpKey}
            data-testid="levelup-flare"
            data-key={levelUpKey}
            className="animate-rock-levelup pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 whitespace-nowrap font-display text-2xl font-bold uppercase tracking-label-sm text-pop opacity-0"
          >
            <Zap className="mr-1 inline h-6 w-6" aria-hidden />
            Level up +{step}
          </span>
        )}
      </div>

      {/* amp-gain meter: start → target */}
      <div className="relative z-10 px-6">
        <div className="mb-2 flex justify-between font-display text-xs font-semibold uppercase tracking-label-sm text-muted-foreground">
          <span>
            Start <b className="text-foreground">{startBpm ?? bpm}</b>
          </span>
          <span>
            Target <b className="text-foreground">{target}</b>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Tempo climb"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-5 overflow-hidden rounded-full border border-border bg-foreground/10"
        >
          <div className="rock-amp-fill h-full rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* next-bump marquee */}
      <div className="relative z-10 flex justify-center pt-4">
        {barsUntilNext !== null && (
          <span className="flex items-center gap-2 rounded-full bg-pop/10 px-4 py-2 font-display text-lg font-semibold tabular-nums text-pop">
            <ChevronsUp className="h-5 w-5" aria-hidden />+{step} BPM in {barsUntilNext}{' '}
            {barsUntilNext === 1 ? 'bar' : 'bars'}
          </span>
        )}
      </div>

      {/* stop */}
      <div className="relative z-10 flex justify-center px-6 pb-8 pt-4">
        <button
          type="button"
          onClick={props.onStop}
          className="flex items-center gap-2 rounded-2xl bg-pop px-14 py-4 font-display text-xl font-bold uppercase tracking-label-sm text-pop-foreground shadow-transport transition-transform active:translate-y-press-lg active:shadow-btn"
        >
          <Square className="h-5 w-5 fill-current" aria-hidden />
          Stop
        </button>
      </div>
    </div>
  );
}
