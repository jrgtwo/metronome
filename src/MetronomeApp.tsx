import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { AdSlot } from 'adkit';
import { useMetronome } from '@fretwork/lib';
import { useTheme } from './theme';
import { Wordmark } from './components/Wordmark';
import { ThemeToggle } from './components/ThemeToggle';
import { MascotHero } from './components/Mascot';
import { BeatDots } from './components/BeatDots';
import { TransportButton } from './components/TransportButton';
import { BpmControl, TempoReadout } from './components/BpmControl';
import { TimeSignaturePicker } from './components/TimeSignaturePicker';
import { FeelControl } from './components/FeelControl';
import { VolumeControl } from './components/VolumeControl';
import { AboutModal } from './components/AboutModal';
import { CalibrationSheet } from './calibration/CalibrationSheet';

/**
 * The whole metronome — one screen. All timing/state comes from the lib's
 * `useMetronome()` hook (which wires the shared store to the engine singleton);
 * this component is just composition + layout. Latency calibration is the one
 * differentiator, behind the gear button.
 */
export function MetronomeApp() {
  const m = useMetronome();
  const { theme, toggle } = useTheme();
  const [calOpen, setCalOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [heroExpanded, setHeroExpanded] = useState(false);

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 py-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button
            type="button"
            onClick={() => setCalOpen(true)}
            aria-label="Latency calibration"
            className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-[0_3px_0_hsl(var(--shadow))] transition-all hover:text-foreground active:translate-y-[3px] active:shadow-none"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Calibrate
          </button>
        </div>
      </header>

      {/* Centerpiece — beats arc over the tempo readout, the beat-eater mascot in
          flow just under it, then the controls. The arc width is capped so the
          pills stay near the number; the mascot is a normal flow item (pulled up
          with a negative margin) so it never overlaps the readout or the slider. */}
      <main className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
        {/* Beats arc + tempo readout shrink when the metronome is enlarged, so
            the emphasis shifts to the metronome without leaving the screen. */}
        <div
          className={`w-full transition-[max-width] duration-300 ease-out ${
            heroExpanded ? 'max-w-[170px]' : 'max-w-[300px]'
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
            <TempoReadout bpm={m.bpm} compact={heroExpanded} />
          </BeatDots>
        </div>

        <button
          type="button"
          onClick={() => setHeroExpanded((v) => !v)}
          aria-label={heroExpanded ? 'Shrink metronome' : 'Enlarge metronome'}
          aria-pressed={heroExpanded}
          title={heroExpanded ? 'Tap to shrink' : 'Tap to enlarge'}
          className="-mt-4 rounded-xl transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className={`pointer-events-none w-auto transition-[height] duration-300 ease-out ${
              heroExpanded ? 'h-44' : 'h-20'
            }`}
          />
        </button>

        <BpmControl bpm={m.bpm} onChange={m.setBpm} />

        <TransportButton isRunning={m.isRunning} onToggle={() => void m.toggle()} />
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

      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      <CalibrationSheet open={calOpen} onClose={() => setCalOpen(false)} />
    </div>
  );
}
