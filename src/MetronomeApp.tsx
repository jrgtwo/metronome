import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { SlidersHorizontal, ArrowLeftRight } from 'lucide-react';
import { useMetronome } from '@fretwork/lib';
import { useTheme } from './theme';
import { useCenterpieceView } from './centerpieceView';
import { useDeckExpanded } from './deckState';
import { usePersistSettings } from './settings';
import { useUrlState } from './urlState';
import { useTempoTrainer, type TrainerDriver } from './tempoTrainer';
import { Button } from './components/ui/button';
import { Wordmark } from './components/Wordmark';
import { ThemeToggle } from './components/ThemeToggle';
import { MascotHero } from './components/Mascot';
import { BeatDots } from './components/BeatDots';
import { TransportButton } from './components/TransportButton';
import { MuteButton } from './components/MuteButton';
import { TempoReadout } from './components/BpmControl';
import { ControlDeck } from './components/ControlDeck';

// Lazy-loaded: only fetched when first opened, so neither the radix/shadcn Dialog
// (AboutModal) nor the calibration UI sits in the initial bundle.
const AboutModal = lazy(() => import('./components/AboutModal').then((m) => ({ default: m.AboutModal })));
const CalibrationSheet = lazy(() =>
  import('./calibration/CalibrationSheet').then((m) => ({ default: m.CalibrationSheet })),
);

// Centerpiece height. The pulse grows to fill the freed space when the deck is
// collapsed, and shrinks back when it expands. Fixed per-state so toggling
// dots↔mascot within a state doesn't shift the layout.
const CENTERPIECE_H = 244; // deck expanded
const CENTERPIECE_H_LG = 340; // deck collapsed — pulse fills the space

/**
 * The whole metronome — one screen. All timing/state comes from the lib's
 * `useMetronome()` hook (which wires the shared store to the engine singleton);
 * this component is just composition + layout.
 *
 * Layout is "instrument + control deck": the pulse (beat-dots arc / mascot + BPM
 * number) and transport are the hero up top; every adjustment lives in a docked,
 * collapsible control deck at the bottom (tempo always shown; meter/feel/swing
 * revealed on expand). Latency calibration is the differentiator, behind the gear.
 */
export function MetronomeApp() {
  // Ref-bridge the engine's bar events into the tempo trainer. The `events` object
  // is recreated each render (the lib reads handlers through a ref, so that's safe),
  // and points at the trainer's stable driver — assigned just below, once `trainer`
  // exists (it can't be referenced here, before it's created).
  const trainerDriverRef = useRef<TrainerDriver | null>(null);
  const m = useMetronome({
    events: {
      measure: () => trainerDriverRef.current?.onMeasure(),
      start: () => trainerDriverRef.current?.onStart(),
    },
  });
  usePersistSettings(m); // restore saved settings on load; save (debounced) on change
  const trainer = useTempoTrainer(m); // auto-accelerate BPM every N bars (FT-7)
  trainerDriverRef.current = trainer.driver;
  useUrlState(m, trainer); // shareable/bookmarkable URL — a link's params win over saved settings
  const { theme, toggle } = useTheme();
  const { view, toggle: toggleView } = useCenterpieceView();
  const { expanded, toggle: toggleDeck } = useDeckExpanded();
  const [calOpen, setCalOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  // Stable identity so the memoized TransportButton doesn't re-render every tick.
  // `m.toggle` is a stable store action; alias it so the hook dep is a plain identifier.
  const toggleMetronome = m.toggle;
  const handleToggle = useCallback(() => void toggleMetronome(), [toggleMetronome]);
  // Pulse is large while the deck is collapsed, so it fills the freed space.
  const big = !expanded;

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 pt-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <Button
            type="button"
            variant="3d"
            onClick={() => setCalOpen(true)}
            aria-label="Latency calibration"
            className="h-auto gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Calibrate
          </Button>
        </div>
      </header>

      {/* Pulse zone (the hero) — one view at a time: the beat-dots arc OR the
          beat-eater mascot, with the BPM number always shown. A small corner swap
          button toggles between them (quiet at rest, full on hover/focus). Then the
          transport: mute beside play. */}
      <main className="flex flex-1 flex-col items-center justify-center gap-5 py-2">
        <div
          className="group relative w-full max-w-arc-lg transition-[height] duration-300 ease-out"
          style={{ height: big ? CENTERPIECE_H_LG : CENTERPIECE_H }}
        >
          {/* The whole pulse (arc/mascot + number) scales as one unit: full size when
              the deck is collapsed, scaled down (crisply, never overflowing) when it
              expands — so the beat markers animate in sync with everything else. */}
          {view === 'dots' ? (
            <div
              className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out ${
                big ? 'scale-100' : 'scale-75'
              }`}
            >
              <BeatDots
                beats={m.timeSignature.numerator}
                accents={m.accents}
                accentEnabled={m.accentEnabled}
                currentBeat={m.currentBeat}
                subdivision={m.subdivision}
                currentSubdivisionIndex={m.currentSubdivisionIndex}
                isRunning={m.isRunning}
              >
                <TempoReadout bpm={m.bpm} large flash={trainer.justReached} />
              </BeatDots>
            </div>
          ) : (
            // Mascot view: big mascot on top, BPM number below it (matches the
            // dots view, where the arc sits over the number).
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-transform duration-300 ease-out ${
                big ? 'scale-100' : 'scale-75'
              }`}
            >
              <MascotHero
                bpm={m.bpm}
                isRunning={m.isRunning}
                beats={m.timeSignature.numerator}
                denominator={m.timeSignature.denominator}
                accents={m.accents}
                accentEnabled={m.accentEnabled}
                subdivision={m.subdivision}
                currentBeat={m.currentBeat}
                className="pointer-events-none h-48 w-auto"
              />
              <TempoReadout bpm={m.bpm} large />
            </div>
          )}

          {/* The only view toggle: a corner swap button. Always present (touch has
              no hover) but quiet at rest, full-strength on hover/keyboard focus. */}
          <button
            type="button"
            onClick={toggleView}
            aria-label={view === 'dots' ? 'Show the mascot' : 'Show the beat dots'}
            title={view === 'dots' ? 'Show the mascot' : 'Show the beat dots'}
            className="absolute right-1.5 top-1.5 rounded-full bg-card/70 p-1.5 text-muted-foreground opacity-40 transition-opacity duration-200 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <MuteButton muted={m.clickMuted} onToggle={m.toggleClickMuted} />
          <TransportButton isRunning={m.isRunning} onToggle={handleToggle} />
        </div>
      </main>

      {/* Docked control deck — tempo always; meter/feel/swing on expand. */}
      <ControlDeck
        expanded={expanded}
        onToggle={toggleDeck}
        bpm={m.bpm}
        onBpm={trainer.handleUserBpm}
        spacebarEnabled={!calOpen && !aboutOpen}
        timeSignatureId={m.timeSignature.id}
        onTimeSignature={m.setTimeSignature}
        subdivision={m.subdivision}
        swing={m.swing}
        onSubdivision={m.setSubdivision}
        onSwing={m.setSwing}
        trainerEnabled={trainer.enabled}
        trainerTarget={trainer.target}
        trainerStep={trainer.step}
        trainerInterval={trainer.interval}
        onTrainerToggle={trainer.toggleEnabled}
        onTrainerTarget={trainer.setTarget}
        onTrainerStep={trainer.setStep}
        onTrainerInterval={trainer.setInterval}
        trainerJustReached={trainer.justReached}
        onAbout={() => setAboutOpen(true)}
      />

      {/* About (crawlable #about-content → modal) is tucked at the bottom of the
          expanded deck, so the header stays uncluttered and the bottom is the deck. */}

      {/* Gated so the chunk loads on first open, not at startup. */}
      {aboutOpen && (
        <Suspense fallback={null}>
          <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
        </Suspense>
      )}
      {calOpen && (
        <Suspense fallback={null}>
          <CalibrationSheet open={calOpen} onClose={() => setCalOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
