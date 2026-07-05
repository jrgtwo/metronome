import { lazy, memo, Suspense, useCallback, useState } from 'react';
import { SlidersHorizontal, ArrowLeftRight } from 'lucide-react';
import { AdSlot as AdSlotBase } from 'adkit';
import { useMetronome } from '@fretwork/lib';
import { useTheme } from './theme';
import { useCenterpieceView } from './centerpieceView';
import { usePersistSettings } from './settings';
import { useUrlState } from './urlState';
import { Button } from './components/ui/button';
import { Wordmark } from './components/Wordmark';
import { ThemeToggle } from './components/ThemeToggle';
import { MascotHero } from './components/Mascot';
import { BeatDots } from './components/BeatDots';
import { TransportButton } from './components/TransportButton';
import { BpmControl, TempoReadout } from './components/BpmControl';
import { TimeSignaturePicker } from './components/TimeSignaturePicker';
import { FeelControl } from './components/FeelControl';
import { VolumeControl } from './components/VolumeControl';

// Lazy-loaded: only fetched when first opened, so neither the radix/shadcn Dialog
// (AboutModal) nor the calibration UI sits in the initial bundle.
const AboutModal = lazy(() => import('./components/AboutModal').then((m) => ({ default: m.AboutModal })));
const CalibrationSheet = lazy(() =>
  import('./calibration/CalibrationSheet').then((m) => ({ default: m.CalibrationSheet })),
);

// Fixed centerpiece height so toggling dots↔mascot doesn't shift the controls
// below (sized to hold the taller mascot view: number + big mascot).
const CENTERPIECE_H = 244;

// The footer ad (adkit, third-party) is beat-independent; memo it so the per-tick
// re-render of MetronomeApp (it reads currentBeat) doesn't re-render the ad. Props
// are stable strings; it still re-renders on its own context (e.g. entitlement) change.
const AdSlot = memo(AdSlotBase);

/**
 * The whole metronome — one screen. All timing/state comes from the lib's
 * `useMetronome()` hook (which wires the shared store to the engine singleton);
 * this component is just composition + layout. Latency calibration is the one
 * differentiator, behind the gear button.
 */
export function MetronomeApp() {
  const m = useMetronome();
  usePersistSettings(m); // restore saved settings on load; save (debounced) on change
  useUrlState(m); // shareable/bookmarkable URL — a link's params win over saved settings
  const { theme, toggle } = useTheme();
  const { view, toggle: toggleView } = useCenterpieceView();
  const [calOpen, setCalOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  // Stable identity so the memoized TransportButton doesn't re-render every tick.
  // `m.toggle` is a stable store action; alias it so the hook dep is a plain identifier.
  const toggleMetronome = m.toggle;
  const handleToggle = useCallback(() => void toggleMetronome(), [toggleMetronome]);

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-4">
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

      {/* Centerpiece — one view at a time: the beat-dots arc OR the beat-eater
          mascot, with the BPM number always shown. Clicking anywhere on it toggles
          between the two (a small swap icon in the corner is the affordance — subtle
          at rest, full on hover/focus). Fixed height so the controls don't shift. */}
      <main className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
        <div
          className="group relative w-full max-w-arc"
          style={{ height: CENTERPIECE_H }}
        >
          {view === 'dots' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <BeatDots
                beats={m.timeSignature.numerator}
                accents={m.accents}
                accentEnabled={m.accentEnabled}
                currentBeat={m.currentBeat}
                subdivision={m.subdivision}
                currentSubdivisionIndex={m.currentSubdivisionIndex}
                isRunning={m.isRunning}
              >
                <TempoReadout bpm={m.bpm} />
              </BeatDots>
            </div>
          ) : (
            // Mascot view: big mascot on top, BPM number below it (matches the
            // dots view, where the arc sits over the number).
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <MascotHero
                bpm={m.bpm}
                isRunning={m.isRunning}
                beats={m.timeSignature.numerator}
                denominator={m.timeSignature.denominator}
                accents={m.accents}
                accentEnabled={m.accentEnabled}
                subdivision={m.subdivision}
                currentBeat={m.currentBeat}
                className="pointer-events-none h-36 w-auto"
              />
              <TempoReadout bpm={m.bpm} />
            </div>
          )}

          {/* The only toggle control: a corner swap button. Always present (touch
              has no hover) but quiet at rest, full-strength on hover/keyboard focus. */}
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

        <BpmControl bpm={m.bpm} onChange={m.setBpm} spacebarEnabled={!calOpen && !aboutOpen} />

        <TransportButton isRunning={m.isRunning} onToggle={handleToggle} />
      </main>

      {/* Controls */}
      <footer className="flex flex-col items-center gap-4 pt-2">
        <TimeSignaturePicker value={m.timeSignature.id} onChange={m.setTimeSignature} />
        <FeelControl
          subdivision={m.subdivision}
          swing={m.swing}
          onSubdivision={m.setSubdivision}
          onSwing={m.setSwing}
        />
        <VolumeControl
          volume={m.volume}
          muted={m.clickMuted}
          onVolume={m.setVolume}
          onToggleMute={m.toggleClickMuted}
        />

        {/* First adkit consumer: a footer house-ad. Hidden once a future
            'removeAds' entitlement is granted (no purchase exists yet). */}
        <AdSlot slot="footer" hideWhenEntitled="removeAds" className="mt-2 w-full max-w-sm text-muted-foreground" />

        {/* Surfaces the crawlable #about-content (index.html) as a modal. */}
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          About metronomnom
        </button>
      </footer>

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
