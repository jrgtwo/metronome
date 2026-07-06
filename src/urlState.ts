import { useEffect, useRef } from 'react';
import type { SubdivisionId } from '@fretwork/lib';
import { TRAINER_DEFAULTS, type TrainerConfig } from './tempoTrainer';

/**
 * Shareable / bookmarkable URL state (FT-12). The *musical* setup — bpm, meter,
 * subdivision, swing — plus the tempo-trainer config (target/step/interval) is
 * mirrored to the query string so a link reproduces it (teacher → student).
 * Personal settings (volume/mute) and the trainer's armed flag stay out of the URL.
 *
 * Wire format uses short keys: `bpm`, `sig`, `sub`, `swing`, `tt`, `ts`, `ti`.
 */
export interface UrlSettings {
  bpm: number;
  timeSignatureId: string;
  subdivision: SubdivisionId;
  swing: number;
}

/** Matches the lib's `DEFAULT_METRONOME_STATE` for the musical settings. */
export const URL_DEFAULTS: UrlSettings = {
  bpm: 120,
  timeSignatureId: '4/4',
  subdivision: 'off',
  swing: 0.5,
};

/** Trainer config defaults for URL omission (mirrors `TRAINER_DEFAULTS`). */
export const TRAINER_URL_DEFAULTS: TrainerConfig = TRAINER_DEFAULTS;

const SUBDIVISIONS: readonly string[] = ['off', '8ths', 'triplets', '16ths', 'sextuplets'];

/** Build a query string containing only settings that differ from the defaults
 *  (so an untouched app keeps a clean, param-free URL). No leading `?`. The
 *  trainer config is appended (keys `tt`/`ts`/`ti`) when provided. */
export function buildUrlQuery(s: UrlSettings, trainer?: TrainerConfig): string {
  const p = new URLSearchParams();
  if (s.bpm !== URL_DEFAULTS.bpm) p.set('bpm', String(s.bpm));
  if (s.timeSignatureId !== URL_DEFAULTS.timeSignatureId) p.set('sig', s.timeSignatureId);
  if (s.subdivision !== URL_DEFAULTS.subdivision) p.set('sub', s.subdivision);
  if (s.swing !== URL_DEFAULTS.swing) p.set('swing', String(s.swing));
  if (trainer) {
    if (trainer.target !== TRAINER_URL_DEFAULTS.target) p.set('tt', String(trainer.target));
    if (trainer.step !== TRAINER_URL_DEFAULTS.step) p.set('ts', String(trainer.step));
    if (trainer.interval !== TRAINER_URL_DEFAULTS.interval) p.set('ti', String(trainer.interval));
  }
  return p.toString();
}

const URL_SYNC_DEBOUNCE_MS = 300;

/** The `useMetronome()` slice this hook reads + writes (full return is a superset). */
export interface UrlStatePort {
  bpm: number;
  timeSignature: { readonly id: string };
  subdivision: SubdivisionId;
  swing: number;
  setBpm: (bpm: number) => void;
  setTimeSignature: (id: string) => void;
  setSubdivision: (id: SubdivisionId) => void;
  setSwing: (swing: number) => void;
}

/** The `useTempoTrainer()` slice this hook reads + writes (config only, no armed flag). */
export interface TrainerUrlPort {
  target: number;
  step: number;
  interval: number;
  applyConfig: (c: Partial<TrainerConfig>) => void;
}

/**
 * Two-way bind the musical setup (+ trainer config) to the URL: apply any params
 * on mount (a shared link wins over saved/default state), then mirror changes back
 * (debounced, `replaceState`, defaults omitted so the address bar stays clean and
 * copyable). Call *after* `usePersistSettings` so the URL takes precedence over
 * localStorage. There is exactly one URL writer — the trainer folds in here rather
 * than owning a second `replaceState` (which would clobber these params).
 */
export function useUrlState(m: UrlStatePort, trainer?: TrainerUrlPort): void {
  const applied = useRef(false);

  useEffect(() => {
    const s = parseUrlSettings(window.location.search);
    // setTimeSignature first (it clears accents), matching the persistence order.
    if (s.timeSignatureId !== undefined) m.setTimeSignature(s.timeSignatureId);
    if (s.bpm !== undefined) m.setBpm(s.bpm);
    if (s.subdivision !== undefined) m.setSubdivision(s.subdivision);
    if (s.swing !== undefined) m.setSwing(s.swing);
    if (trainer) trainer.applyConfig(parseTrainerUrl(window.location.search));
    applied.current = true;
    // Run exactly once on mount; the setters are stable store/hook actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primitive trainer values as deps (so the effect body never closes over the
  // whole `trainer` object — keeps exhaustive-deps happy alongside `m.*`).
  const tTarget = trainer?.target;
  const tStep = trainer?.step;
  const tInterval = trainer?.interval;

  useEffect(() => {
    if (!applied.current) return;
    const trainerCfg =
      tTarget !== undefined && tStep !== undefined && tInterval !== undefined
        ? { target: tTarget, step: tStep, interval: tInterval }
        : undefined;
    const query = buildUrlQuery(
      {
        bpm: m.bpm,
        timeSignatureId: m.timeSignature.id,
        subdivision: m.subdivision,
        swing: m.swing,
      },
      trainerCfg,
    );
    const id = setTimeout(() => {
      const url = window.location.pathname + (query ? `?${query}` : '') + window.location.hash;
      window.history.replaceState(null, '', url);
    }, URL_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [m.bpm, m.timeSignature.id, m.subdivision, m.swing, tTarget, tStep, tInterval]);
}

function num(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse the musical settings out of a query string, keeping only present + valid fields. */
export function parseUrlSettings(search: string): Partial<UrlSettings> {
  const p = new URLSearchParams(search);
  const out: Partial<UrlSettings> = {};
  const bpm = num(p.get('bpm'));
  if (bpm !== undefined) out.bpm = bpm;
  const sig = p.get('sig');
  if (sig) out.timeSignatureId = sig;
  const sub = p.get('sub');
  if (sub && SUBDIVISIONS.includes(sub)) out.subdivision = sub as SubdivisionId;
  const swing = num(p.get('swing'));
  if (swing !== undefined) out.swing = swing;
  return out;
}

/** Parse the tempo-trainer config out of a query string (keys `tt`/`ts`/`ti`),
 *  keeping only present + valid fields. Ranges are clamped by `applyConfig`. */
export function parseTrainerUrl(search: string): Partial<TrainerConfig> {
  const p = new URLSearchParams(search);
  const out: Partial<TrainerConfig> = {};
  const target = num(p.get('tt'));
  if (target !== undefined) out.target = target;
  const step = num(p.get('ts'));
  if (step !== undefined) out.step = step;
  const interval = num(p.get('ti'));
  if (interval !== undefined) out.interval = interval;
  return out;
}
