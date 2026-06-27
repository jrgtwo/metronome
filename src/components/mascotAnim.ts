/**
 * Pure phase math for the hero metronome animation. Kept separate (and pure) so
 * the anchor invariants are unit-testable. The key property: both functions are
 * derived purely from the engine's CURRENT position — they carry no accumulated
 * history — so the animation stays anchored across tempo / meter / feel changes
 * (the previous accumulator-based version drifted when those changed).
 */
export const SP = 15; // horizontal spacing between notes (user units)
export const X_MOUTH = 67; // a note sits here (entering the metronome) on its tick
export const MAX_ANGLE = 16; // pendulum swing amplitude (degrees)

/**
 * Conveyor x-translation. With notes laid out at `X_MOUTH + i*SP`, this puts the
 * note whose index equals `inMeasureTick` exactly at the mouth when `frac === 0`,
 * and loops seamlessly at the measure boundary. Depends only on the current
 * in-measure tick, so it re-anchors immediately after any change.
 */
export function conveyorTranslate(inMeasureTick: number, frac: number, patternWidth: number): number {
  const phase = (inMeasureTick + frac) * SP;
  const off = ((phase % patternWidth) + patternWidth) % patternWidth;
  return -off;
}

/**
 * Pendulum angle in degrees. `monotonicBeat` counts beats since playback started
 * (so the pendulum alternates sides every beat across bar lines, including odd
 * meters); the in-beat position eases the swing. At every integer beat it sits
 * at an extreme (far left on beat 0).
 */
export function pendulumAngle(
  monotonicBeat: number,
  subIndex: number,
  frac: number,
  subsPerBeat: number,
): number {
  const beatPhase = monotonicBeat + (subIndex + frac) / Math.max(1, subsPerBeat);
  return -MAX_ANGLE * Math.cos(Math.PI * beatPhase);
}

/**
 * Duration of one counted pulse (the steady tick the pendulum swings on), in ms.
 * `bpm` is quarter-note pulses/min and `denominator` is the note value of one
 * pulse (4=quarter, 8=eighth, 2=half), so a /8 pulse is half a quarter. This is
 * even regardless of meter, subdivision, or swing — a real metronome's tick.
 */
export function beatDurationMs(bpm: number, denominator: number): number {
  return (60000 / bpm) * (4 / denominator);
}

/* ── Hula body sway ─────────────────────────────────────────────────────────
 * A second beat-synced motion: the metronome BODY bends side to side ("hula").
 * Feet stay planted, the hips swing, and the region at/above the mouth stays
 * roughly still so the conveyor's note still lands in the mouth on the beat.
 * Like the functions above these are derived purely from the current position,
 * so the sway re-anchors across tempo/meter/feel changes. The pendulum is NOT
 * driven by these — it keeps only its own tick (see Mascot.tsx).
 */
export const Y_FOOT = 86; // base of the body (planted)
export const Y_TOP = 28; // top of the dome
export const Y_MOUTH = 70; // mouth line — the conveyor compensates by the offset here
const SPAN = Y_FOOT - Y_TOP; // normalize height to 0 (feet) … 1 (top)
const TOP_COUNTER = 0.35; // how much the top counter-leans against the mid-body bulge
// Peak of the (un-normalized) shape, so `amp` reads as the max sway in user units.
const SHAPE_PEAK = (() => {
  let m = 0;
  for (let t = 0; t <= 1; t += 0.001) m = Math.max(m, Math.sin(Math.PI * t) - TOP_COUNTER * t);
  return m;
})();

// Sensible defaults (tuned live in the app); exported so the component shares them.
export const BODY_AMP = 6; // hip swing amplitude (user units)
export const BODY_BOB = 1.5; // vertical hop at each side extreme
export const BEATS_PER_SWAY = 2; // one full left→right→left per N beats

/**
 * Smooth sway value in [-1, 1]. With `beatsPerSway = 2` this equals the
 * pendulum's normalized swing, so the hips move in phase with the weight; an
 * extreme lands on every beat (far left on beat 0).
 */
export function bodySway(
  monotonicBeat: number,
  subIndex: number,
  frac: number,
  subsPerBeat: number,
  beatsPerSway: number = BEATS_PER_SWAY,
): number {
  const beatPhase = monotonicBeat + (subIndex + frac) / Math.max(1, subsPerBeat);
  return -Math.cos((2 * Math.PI * beatPhase) / beatsPerSway);
}

/** Whole-body sway profile (normalized so the peak is ±1): 0 at the planted feet,
 *  bulging through the mid-body, with the top counter-leaning for life. The whole
 *  metronome curves as one — not a low blob by the base. */
function swayShape(t: number): number {
  const tc = Math.min(1, Math.max(0, t));
  return (Math.sin(Math.PI * tc) - TOP_COUNTER * tc) / SHAPE_PEAK;
}

/** Horizontal bend (user units) of the body at height `y` for sway `s`. */
export function bodyOffset(y: number, s: number, amp: number): number {
  const t = (Y_FOOT - y) / SPAN;
  return amp * s * swayShape(t);
}

/** Vertical hop (≤ 0, i.e. up), greatest at the side extremes. */
export function bodyBob(s: number, bobAmt: number): number {
  return -bobAmt * Math.abs(s) || 0; // `|| 0` collapses -0 to +0
}

// Half-width of the body at height `y`: 20 at the feet → 11 at the shoulders.
function halfWidth(y: number): number {
  return 11 + (9 * (y - 33)) / 53;
}

// The two long edges are subdivided so the hip lobe can curve them; at rest the
// added points stay collinear, so the silhouette matches the static mark.
const EDGE_YS: number[] = (() => {
  const ys: number[] = [];
  for (let y = Y_FOOT; y > 33; y -= 4) ys.push(y);
  ys.push(33);
  return ys;
})();

/**
 * The bent body outline as an SVG path `d`. Built from the authored silhouette
 * (feet → shoulders straight edges, rounded dome) with every x shifted by
 * `bodyOffset`. At `s = 0` it equals the rest shape.
 */
export function bodyPath(s: number, amp: number): string {
  const lx = (y: number) => (50 + bodyOffset(y, s, amp) - halfWidth(y)).toFixed(2);
  const rx = (y: number) => (50 + bodyOffset(y, s, amp) + halfWidth(y)).toFixed(2);
  const dome = (x: number, y: number) => (x + bodyOffset(y, s, amp)).toFixed(2);

  let d = `M ${lx(Y_FOOT)} ${Y_FOOT}`;
  for (let i = 1; i < EDGE_YS.length; i++) d += ` L ${lx(EDGE_YS[i])} ${EDGE_YS[i]}`;
  // rounded dome (mirrors the authored Q…L…Q across the top)
  d += ` Q ${dome(40, 28)} 28 ${dome(45, 28)} 28`;
  d += ` L ${dome(55, 28)} 28`;
  d += ` Q ${dome(60, 28)} 28 ${dome(61, 33)} 33`;
  for (let i = EDGE_YS.length - 2; i >= 0; i--) d += ` L ${rx(EDGE_YS[i])} ${EDGE_YS[i]}`;
  return `${d} Z`;
}
